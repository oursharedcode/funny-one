# Funny Family «Чепуха 37» — the Always-Free VM for the self-hosted deploy
# (T-8.1, FM-NFR-3, owner decision D-5). Run after network.py.
#
# Launches `funny-vm` from the latest Canonical Ubuntu 24.04 image with a
# cloud-init that opens 80/443 in the image's iptables (Oracle's Ubuntu
# rejects everything but 22 by default) and installs Docker + Compose.
# Tries the free Arm shape (VM.Standard.A1.Flex, 2 OCPU / 12 GB) six times —
# Sydney is usually out of Arm capacity — then falls back to the free AMD
# shape (VM.Standard.E2.1.Micro, 1 GB; build images elsewhere and stream
# them in). A *reserved* public IP `funny-ip` is attached so the address
# survives replacing the VM. Ids and the IP go to ~/.oci/funny-infra.json.
#
# Idempotent for the instance (found by name, never re-launched) and the IP.
# To swap to Arm later: terminate the instance, re-run; the IP is re-attached.
# Usage: python deploy/oci/vm.py   (SSH key: ~/.ssh/id_ed25519.pub)
import base64, json, os, time
import oci

cfg = oci.config.from_file()
state_path = os.path.expanduser("~/.oci/funny-infra.json")
state = json.load(open(state_path))
comp = state["compartment"]
compute = oci.core.ComputeClient(cfg)
vnet = oci.core.VirtualNetworkClient(cfg)
idc = oci.identity.IdentityClient(cfg)
ad = idc.list_availability_domains(comp).data[0].name
ssh_pub = open(os.path.expanduser("~/.ssh/id_ed25519.pub")).read().strip()

CLOUD_INIT = """#cloud-config
package_update: true
package_upgrade: true
runcmd:
  - iptables -I INPUT -p tcp --dport 80 -j ACCEPT
  - iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  - netfilter-persistent save
  - curl -fsSL https://get.docker.com | sh
  - usermod -aG docker ubuntu
"""

def latest_image(shape):
    imgs = compute.list_images(comp, operating_system="Canonical Ubuntu",
                               operating_system_version="24.04", shape=shape,
                               sort_by="TIMECREATED", sort_order="DESC").data
    imgs = [i for i in imgs if "Minimal" not in i.display_name]
    return imgs[0]

def existing():
    for i in compute.list_instances(comp, display_name="funny-vm").data:
        if i.lifecycle_state not in ("TERMINATED", "TERMINATING"):
            return i
    return None

def launch(shape, shape_cfg):
    img = latest_image(shape)
    details = oci.core.models.LaunchInstanceDetails(
        compartment_id=comp, availability_domain=ad, display_name="funny-vm",
        shape=shape, shape_config=shape_cfg,
        source_details=oci.core.models.InstanceSourceViaImageDetails(
            image_id=img.id, boot_volume_size_in_gbs=50),
        create_vnic_details=oci.core.models.CreateVnicDetails(
            subnet_id=state["subnet"], assign_public_ip=False, hostname_label="funny"),
        metadata={"ssh_authorized_keys": ssh_pub,
                  "user_data": base64.b64encode(CLOUD_INIT.encode()).decode()})
    return compute.launch_instance(details).data, img.display_name

inst = existing()
if inst:
    print("instance already exists:", inst.lifecycle_state)
else:
    a1 = oci.core.models.LaunchInstanceShapeConfigDetails(ocpus=2, memory_in_gbs=12)
    inst = None
    for attempt in range(1, 7):
        try:
            inst, img_name = launch("VM.Standard.A1.Flex", a1)
            print(f"launched A1.Flex 2/12 on attempt {attempt}, image {img_name}")
            break
        except oci.exceptions.ServiceError as e:
            msg = (e.message or "")[:120]
            print(f"attempt {attempt}: {e.status} {e.code}: {msg}")
            if "capacity" not in msg.lower() and e.code not in ("InternalError", "LimitExceeded", "TooManyRequests"):
                raise
            time.sleep(20)
    if inst is None:
        inst, img_name = launch("VM.Standard.E2.1.Micro", None)
        print("FALLBACK: launched E2.1.Micro (AMD, 1 GB), image", img_name)

inst = oci.wait_until(compute, compute.get_instance(inst.id), "lifecycle_state", "RUNNING",
                      max_wait_seconds=600).data
print("instance", inst.shape, inst.lifecycle_state)

# Reserved (stable) public IP on the primary VNIC
vnic_id = compute.list_vnic_attachments(comp, instance_id=inst.id).data[0].vnic_id
priv = vnet.list_private_ips(vnic_id=vnic_id).data[0]
pubs = [p for p in vnet.list_public_ips(scope="REGION", compartment_id=comp, lifetime="RESERVED").data
        if p.display_name == "funny-ip" and p.lifecycle_state != "TERMINATED"]
if pubs:
    pub = pubs[0]
    if pub.private_ip_id != priv.id:
        pub = vnet.update_public_ip(pub.id, oci.core.models.UpdatePublicIpDetails(private_ip_id=priv.id)).data
else:
    pub = vnet.create_public_ip(oci.core.models.CreatePublicIpDetails(
        compartment_id=comp, lifetime="RESERVED", display_name="funny-ip", private_ip_id=priv.id)).data
pub = oci.wait_until(vnet, vnet.get_public_ip(pub.id), "lifecycle_state", "ASSIGNED", max_wait_seconds=120).data
print("public ip:", pub.ip_address, "(reserved)")

state.update(instance=inst.id, shape=inst.shape, vnic=vnic_id, public_ip_id=pub.id,
             public_ip=pub.ip_address, ssh_user="ubuntu")
json.dump(state, open(state_path, "w"), indent=2)
print("saved")
