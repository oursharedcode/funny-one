// SPDX-License-Identifier: AGPL-3.0-only

// Id -> component registry for every slot that has rig art (T-FO-4.2, FO-IMG-1;
// `when` badges added in T-FO-4.2a, `why` bubbles in T-FO-4.2b, `end` stamps in
// T-FO-4.2c — all seven pools are covered now). Every component shares the
// mascot contract: default export, `className` prop only (RIG_ART.md "File / id
// mapping"). rigIndex.test.ts asserts this map is exactly bijective with the
// pools it covers — the thing worth guarding here is a pool edit silently
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

import AfterBreakfast from './when/AfterBreakfast';
import ClocksStopped from './when/ClocksStopped';
import DayBeforeBirthday from './when/DayBeforeBirthday';
import ExactlyNoon from './when/ExactlyNoon';
import FirstSnow from './when/FirstSnow';
import FullMoon from './when/FullMoon';
import HatFestival from './when/HatFestival';
import InternetOutage from './when/InternetOutage';
import JustBeforeDinner from './when/JustBeforeDinner';
import LastDayOfSummer from './when/LastDayOfSummer';
import LongestLesson from './when/LongestLesson';
import PowerCut from './when/PowerCut';
import RushHour from './when/RushHour';
import SchoolHolidays from './when/SchoolHolidays';
import SeagullDecision from './when/SeagullDecision';
import SmallEarthquake from './when/SmallEarthquake';
import SolarEclipse from './when/SolarEclipse';
import SomeoneElsesWedding from './when/SomeoneElsesWedding';
import ThreeInTheMorning from './when/ThreeInTheMorning';
import Thunderstorm from './when/Thunderstorm';
import WhileEveryoneSlept from './when/WhileEveryoneSlept';
import WrongFeelingTuesday from './when/WrongFeelingTuesday';

import AvoidHomework from './why/AvoidHomework';
import BecauseTuesday from './why/BecauseTuesday';
import BetWithThemselves from './why/BetWithThemselves';
import EveryoneElseDid from './why/EveryoneElseDid';
import ForASticker from './why/ForASticker';
import ForScience from './why/ForScience';
import ForgotThePlan from './why/ForgotThePlan';
import HoroscopeSaidSo from './why/HoroscopeSaidSo';
import ImpressAPigeon from './why/ImpressAPigeon';
import ImpressGrandma from './why/ImpressGrandma';
import InstructionsSaidSo from './why/InstructionsSaidSo';
import MadeSenseThen from './why/MadeSenseThen';
import NeverBackDown from './why/NeverBackDown';
import NoReason from './why/NoReason';
import OneGrape from './why/OneGrape';
import PointlessPoint from './why/PointlessPoint';
import PureStubbornness from './why/PureStubbornness';
import SimplyHungry from './why/SimplyHungry';
import TestATheory from './why/TestATheory';
import ToKeepWarm from './why/ToKeepWarm';
import WarrantyForbadeIt from './why/WarrantyForbadeIt';
import WorldRecord from './why/WorldRecord';

import ASongAboutIt from './end/ASongAboutIt';
import CatTookCredit from './end/CatTookCredit';
import CloudLookedAway from './end/CloudLookedAway';
import DuckComplaint from './end/DuckComplaint';
import EveryoneFellAsleep from './end/EveryoneFellAsleep';
import FeelingsAboutPasta from './end/FeelingsAboutPasta';
import FruitBasket from './end/FruitBasket';
import HomeForSoup from './end/HomeForSoup';
import IceCreamForAll from './end/IceCreamForAll';
import IndoorRainbow from './end/IndoorRainbow';
import InstantSequel from './end/InstantSequel';
import InstructionsFinallyClear from './end/InstructionsFinallyClear';
import LostReceipts from './end/LostReceipts';
import MuseumExhibit from './end/MuseumExhibit';
import NeighborsApplauded from './end/NeighborsApplauded';
import NeverSpokeAgain from './end/NeverSpokeAgain';
import NewHolidayInvented from './end/NewHolidayInvented';
import NothingMadeSense from './end/NothingMadeSense';
import PigeonCertificates from './end/PigeonCertificates';
import SmelledLikeLemons from './end/SmelledLikeLemons';
import SomeoneHadToMop from './end/SomeoneHadToMop';
import ThreeCountryHoliday from './end/ThreeCountryHoliday';

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

  'when.small-earthquake': SmallEarthquake,
  'when.solar-eclipse': SolarEclipse,
  'when.after-breakfast': AfterBreakfast,
  'when.someone-elses-wedding': SomeoneElsesWedding,
  'when.wrong-feeling-tuesday': WrongFeelingTuesday,
  'when.clocks-stopped': ClocksStopped,
  'when.three-in-the-morning': ThreeInTheMorning,
  'when.hat-festival': HatFestival,
  'when.internet-outage': InternetOutage,
  'when.seagull-decision': SeagullDecision,
  'when.last-day-of-summer': LastDayOfSummer,
  'when.thunderstorm': Thunderstorm,
  'when.first-snow': FirstSnow,
  'when.school-holidays': SchoolHolidays,
  'when.full-moon': FullMoon,
  'when.power-cut': PowerCut,
  'when.just-before-dinner': JustBeforeDinner,
  'when.longest-lesson': LongestLesson,
  'when.day-before-birthday': DayBeforeBirthday,
  'when.rush-hour': RushHour,
  'when.while-everyone-slept': WhileEveryoneSlept,
  'when.exactly-noon': ExactlyNoon,

  'why.made-sense-then': MadeSenseThen,
  'why.impress-a-pigeon': ImpressAPigeon,
  'why.warranty-forbade-it': WarrantyForbadeIt,
  'why.one-grape': OneGrape,
  'why.never-back-down': NeverBackDown,
  'why.pointless-point': PointlessPoint,
  'why.for-science': ForScience,
  'why.pure-stubbornness': PureStubbornness,
  'why.horoscope-said-so': HoroscopeSaidSo,
  'why.bet-with-themselves': BetWithThemselves,
  'why.to-keep-warm': ToKeepWarm,
  'why.because-tuesday': BecauseTuesday,
  'why.for-a-sticker': ForASticker,
  'why.avoid-homework': AvoidHomework,
  'why.everyone-else-did': EveryoneElseDid,
  'why.world-record': WorldRecord,
  'why.simply-hungry': SimplyHungry,
  'why.impress-grandma': ImpressGrandma,
  'why.forgot-the-plan': ForgotThePlan,
  'why.instructions-said-so': InstructionsSaidSo,
  'why.test-a-theory': TestATheory,
  'why.no-reason': NoReason,

  'end.feelings-about-pasta': FeelingsAboutPasta,
  'end.duck-complaint': DuckComplaint,
  'end.nothing-made-sense': NothingMadeSense,
  'end.lost-receipts': LostReceipts,
  'end.pigeon-certificates': PigeonCertificates,
  'end.fruit-basket': FruitBasket,
  'end.instant-sequel': InstantSequel,
  'end.three-country-holiday': ThreeCountryHoliday,
  'end.cloud-looked-away': CloudLookedAway,
  'end.never-spoke-again': NeverSpokeAgain,
  'end.ice-cream-for-all': IceCreamForAll,
  'end.someone-had-to-mop': SomeoneHadToMop,
  'end.museum-exhibit': MuseumExhibit,
  'end.a-song-about-it': ASongAboutIt,
  'end.neighbors-applauded': NeighborsApplauded,
  'end.smelled-like-lemons': SmelledLikeLemons,
  'end.new-holiday-invented': NewHolidayInvented,
  'end.cat-took-credit': CatTookCredit,
  'end.everyone-fell-asleep': EveryoneFellAsleep,
  'end.indoor-rainbow': IndoorRainbow,
  'end.instructions-finally-clear': InstructionsFinallyClear,
  'end.home-for-soup': HomeForSoup,
};
