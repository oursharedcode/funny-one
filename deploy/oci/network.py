# Funny Family «Чепуха 37» — Oracle Cloud network for the self-hosted deploy
# (T-8.1, FM-NFR-3, owner decision D-5). Idempotent: re-running finds the
# resources by name and only (re)applies the security-list rules.
#
# Creates, in the tenancy's root compartment: VCN `funny-vcn` (10.0.0.0/16),
# internet gateway, a default route out, security list `funny-web` (22 from
# the operator's IP only, 80/443 from anywhere, ICMP path-MTU) and public
# subnet `funny-public` (10.0.0.0/24). Resource ids are written to
# ~/.oci/funny-infra.json for vm.py.
#
# Prereqs: `pip install oci` and an API key in ~/.oci/config (Console → My
# profile → API keys). Usage: python deploy/oci/network.py <your public IPv4>
import json, os, sys
import oci

MYIP = sys.argv[1]
cfg = oci.config.from_file()
comp = cfg["tenancy"]                      # root compartment — free tier, single project
vcn_client = oci.core.VirtualNetworkClient(cfg)
comp_client = oci.core.VirtualNetworkClientCompositeOperations(vcn_client)

def find(lister, name, **kw):
    for r in oci.pagination.list_call_get_all_results(lister, comp, **kw).data:
        if r.display_name == name and r.lifecycle_state not in ("TERMINATED", "TERMINATING"):
            return r
    return None

# 1. VCN
vcn = find(vcn_client.list_vcns, "funny-vcn")
if not vcn:
    vcn = comp_client.create_vcn_and_wait_for_state(
        oci.core.models.CreateVcnDetails(compartment_id=comp, display_name="funny-vcn",
                                         cidr_block="10.0.0.0/16", dns_label="funny"),
        wait_for_states=["AVAILABLE"]).data
print("vcn", vcn.id)

# 2. Internet gateway
igw = find(vcn_client.list_internet_gateways, "funny-igw", vcn_id=vcn.id)
if not igw:
    igw = comp_client.create_internet_gateway_and_wait_for_state(
        oci.core.models.CreateInternetGatewayDetails(compartment_id=comp, vcn_id=vcn.id,
                                                     display_name="funny-igw", is_enabled=True),
        wait_for_states=["AVAILABLE"]).data
print("igw", igw.id)

# 3. Default route table: 0.0.0.0/0 -> igw
rt = vcn_client.get_route_table(vcn.default_route_table_id).data
if not any(r.destination == "0.0.0.0/0" for r in rt.route_rules):
    rules = rt.route_rules + [oci.core.models.RouteRule(destination="0.0.0.0/0",
                                                        destination_type="CIDR_BLOCK",
                                                        network_entity_id=igw.id)]
    vcn_client.update_route_table(rt.id, oci.core.models.UpdateRouteTableDetails(route_rules=rules))
print("route table", rt.id)

# 4. Security list: 22 from owner IP, 80/443 from anywhere, ICMP path-MTU, egress all
def tcp(src, port):
    return oci.core.models.IngressSecurityRule(
        protocol="6", source=src, source_type="CIDR_BLOCK", is_stateless=False,
        tcp_options=oci.core.models.TcpOptions(
            destination_port_range=oci.core.models.PortRange(min=port, max=port)))
ingress = [
    tcp(f"{MYIP}/32", 22),
    tcp("0.0.0.0/0", 80),
    tcp("0.0.0.0/0", 443),
    oci.core.models.IngressSecurityRule(protocol="1", source="0.0.0.0/0", source_type="CIDR_BLOCK",
        is_stateless=False, icmp_options=oci.core.models.IcmpOptions(type=3, code=4)),
]
egress = [oci.core.models.EgressSecurityRule(protocol="all", destination="0.0.0.0/0",
                                             destination_type="CIDR_BLOCK", is_stateless=False)]
sl = find(vcn_client.list_security_lists, "funny-web", vcn_id=vcn.id)
if not sl:
    sl = comp_client.create_security_list_and_wait_for_state(
        oci.core.models.CreateSecurityListDetails(compartment_id=comp, vcn_id=vcn.id,
            display_name="funny-web", ingress_security_rules=ingress, egress_security_rules=egress),
        wait_for_states=["AVAILABLE"]).data
else:
    vcn_client.update_security_list(sl.id, oci.core.models.UpdateSecurityListDetails(
        ingress_security_rules=ingress, egress_security_rules=egress))
print("security list", sl.id)

# 5. Public subnet
sub = find(vcn_client.list_subnets, "funny-public", vcn_id=vcn.id)
if not sub:
    sub = comp_client.create_subnet_and_wait_for_state(
        oci.core.models.CreateSubnetDetails(compartment_id=comp, vcn_id=vcn.id,
            display_name="funny-public", cidr_block="10.0.0.0/24", dns_label="pub",
            route_table_id=rt.id, security_list_ids=[sl.id], prohibit_public_ip_on_vnic=False),
        wait_for_states=["AVAILABLE"]).data
print("subnet", sub.id)

out = os.path.expanduser("~/.oci/funny-infra.json")
state = json.load(open(out)) if os.path.exists(out) else {}
state.update(compartment=comp, vcn=vcn.id, igw=igw.id, route_table=rt.id,
             security_list=sl.id, subnet=sub.id, ssh_allowed_from=f"{MYIP}/32")
json.dump(state, open(out, "w"), indent=2)
print("saved", out)
