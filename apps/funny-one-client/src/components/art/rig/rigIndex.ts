// SPDX-License-Identifier: AGPL-3.0-only

// Id -> component registry for the 4 visual slots (T-FO-4.2, FO-IMG-1), built
// once all 40 assets existed (RIG_ART.md). Every component shares the mascot
// contract: default export, `className` prop only (RIG_ART.md "File / id
// mapping"). rigIndex.test.ts asserts this map is exactly bijective with
// `POOLS[0/1/2/4]` — the thing worth guarding here is a pool edit silently
// losing its art, not the lookup itself.

import type { ComponentType } from 'react';
import type { OptionId } from '@funny/shared';

import CatsInATrenchCoat from './who/CatsInATrenchCoat';
import ConfusedPenguin from './who/ConfusedPenguin';
import GrumpyPirate from './who/GrumpyPirate';
import MuddyKnight from './who/MuddyKnight';
import OverconfidentRaccoon from './who/OverconfidentRaccoon';
import RetiredSuperhero from './who/RetiredSuperhero';
import SkatingGrandma from './who/SkatingGrandma';
import SleepyLlama from './who/SleepyLlama';
import TimeTravelingAccountant from './who/TimeTravelingAccountant';
import TinyDragon from './who/TinyDragon';

import AngryGeese from './with/AngryGeese';
import GiantSnail from './with/GiantSnail';
import HauntedToaster from './with/HauntedToaster';
import LostTourist from './with/LostTourist';
import OperaWalrus from './with/OperaWalrus';
import PhilosophicalGoldfish from './with/PhilosophicalGoldfish';
import ProfessorGoat from './with/ProfessorGoat';
import RiddleRobot from './with/RiddleRobot';
import TalkingMailbox from './with/TalkingMailbox';
import TubaFrog from './with/TubaFrog';

import CheeseFactory from './where/CheeseFactory';
import CloudCastle from './where/CloudCastle';
import CookbookLibrary from './where/CookbookLibrary';
import CrampedElevator from './where/CrampedElevator';
import GiantSockDrawer from './where/GiantSockDrawer';
import GloomyBirthday from './where/GloomyBirthday';
import JungleTreehouse from './where/JungleTreehouse';
import MessyKitchen from './where/MessyKitchen';
import SnowyMountain from './where/SnowyMountain';
import UnderwaterCanyon from './where/UnderwaterCanyon';

import BakingGiantCake from './did/BakingGiantCake';
import DancingTango from './did/DancingTango';
import DiggingWithSpoons from './did/DiggingWithSpoons';
import EatingSpaghetti from './did/EatingSpaghetti';
import FlyingKites from './did/FlyingKites';
import JugglingPancakes from './did/JugglingPancakes';
import PaintingPolkaDots from './did/PaintingPolkaDots';
import SortingClouds from './did/SortingClouds';
import StackingChairs from './did/StackingChairs';
import StaringContest from './did/StaringContest';

export interface RigAssetProps {
  className?: string;
}

export const RIG_INDEX: Readonly<Record<OptionId, ComponentType<RigAssetProps>>> = {
  'who.grumpy-pirate': GrumpyPirate,
  'who.sleepy-llama': SleepyLlama,
  'who.confused-penguin': ConfusedPenguin,
  'who.overconfident-raccoon': OverconfidentRaccoon,
  'who.tiny-dragon': TinyDragon,
  'who.cats-in-a-trench-coat': CatsInATrenchCoat,
  'who.retired-superhero': RetiredSuperhero,
  'who.skating-grandma': SkatingGrandma,
  'who.time-traveling-accountant': TimeTravelingAccountant,
  'who.muddy-knight': MuddyKnight,

  'with.haunted-toaster': HauntedToaster,
  'with.angry-geese': AngryGeese,
  'with.philosophical-goldfish': PhilosophicalGoldfish,
  'with.riddle-robot': RiddleRobot,
  'with.professor-goat': ProfessorGoat,
  'with.lost-tourist': LostTourist,
  'with.giant-snail': GiantSnail,
  'with.tuba-frog': TubaFrog,
  'with.talking-mailbox': TalkingMailbox,
  'with.opera-walrus': OperaWalrus,

  'where.cheese-factory': CheeseFactory,
  'where.underwater-canyon': UnderwaterCanyon,
  'where.cookbook-library': CookbookLibrary,
  'where.giant-sock-drawer': GiantSockDrawer,
  'where.gloomy-birthday': GloomyBirthday,
  'where.cramped-elevator': CrampedElevator,
  'where.cloud-castle': CloudCastle,
  'where.messy-kitchen': MessyKitchen,
  'where.snowy-mountain': SnowyMountain,
  'where.jungle-treehouse': JungleTreehouse,

  'did.baking-giant-cake': BakingGiantCake,
  'did.juggling-pancakes': JugglingPancakes,
  'did.painting-polka-dots': PaintingPolkaDots,
  'did.sorting-clouds': SortingClouds,
  'did.dancing-tango': DancingTango,
  'did.stacking-chairs': StackingChairs,
  'did.staring-contest': StaringContest,
  'did.flying-kites': FlyingKites,
  'did.eating-spaghetti': EatingSpaghetti,
  'did.digging-with-spoons': DiggingWithSpoons,
};
