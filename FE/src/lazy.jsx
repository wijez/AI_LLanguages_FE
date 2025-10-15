import { lazy } from 'react';

// helper 
const L = (p) => lazy(() => import(p));

// Nav + layout
export const LeftNav            = L('./components/LeftNav.jsx');
export const RightNav           = L('./components/RightNav.jsx');
export const MainLayout         = L('./layouts/MainLayout.jsx');
export const MobileBottomNav    = L('./components/Bars/MobileBottomNav.jsx');

// Contents
export const Practice       = L('./components/Contents/Practice.jsx');
export const Learn          = L('./components/Contents/Learn.jsx');
export const Task           = L('./components/Contents/Task.jsx');
export const Rank           = L('./components/Contents/Rank.jsx');
export const Info           = L('./components/Contents/Info.jsx');
export const Profile        = L('./components/Contents/Profile.jsx');
export const More           = L('./components/Contents/More.jsx');
export const Speech         = L('./components/Contents/Speech.jsx');
export const Exercise       = L('./components/Contents/Exercise.jsx');
export const Shop           = L('./components/Contents/Shop.jsx');

// Pages
export const TaskPage       = L('./pages/TaskPage.jsx');
export const PracticePage   = L('./pages/PracticePage.jsx');
export const LearnPage      = L('./pages/LearnPage.jsx');
export const RankPage       = L('./pages/RankPage.jsx');
export const InfoPage       = L('./pages/InfoPage.jsx');
export const MorePage       = L('./pages/MorePage.jsx');
export const SpeechPage     = L('./pages/SpeechPage.jsx');
export const ExercisePage   = L('./pages/ExercisePage.jsx');
export const ShopPage       = L('./pages/ShopPage.jsx');
