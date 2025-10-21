import { lazy } from 'react';

export const LeftNav = lazy(() => import('./components/LeftNav.jsx'));
export const RightNav = lazy(() => import('./components/RightNav.jsx'));
export const MainLayout = lazy(() => import('./layouts/MainLayout.jsx'));
export const MobileBottomNav = lazy(() => import('./components/Bars/MobileBottomNav.jsx'));

// Dropdowns
export const LanguageDropdown = lazy(() => import('./components/Dropdowns/LanguageDropdown.jsx'));

// Contents
export const Practice = lazy(() => import('./components/Contents/Practice.jsx'));
export const Learn = lazy(() => import('./components/Contents/Learn.jsx'));
export const Task = lazy(() => import('./components/Contents/Task.jsx'));
export const Rank = lazy(() => import('./components/Contents/Rank.jsx'));
export const Info = lazy(() => import('./components/Contents/Info.jsx'));
export const Profile = lazy(() => import('./components/Contents/Profile.jsx'));
export const More = lazy(() => import('./components/Contents/More.jsx'));
export const Speech = lazy(() => import('./components/Contents/Speech.jsx'));
// export const Exercise = lazy(() => import('./components/Contents/Exercise.jsx'));
export const Shop = lazy(() => import('./components/Contents/Shop.jsx'));

// Pages
export const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
export const TaskPage = lazy(() => import('./pages/TaskPage.jsx'));
export const PracticePage = lazy(() => import('./pages/PracticePage.jsx'));
export const LearnPage = lazy(() => import('./pages/LearnPage.jsx'));
export const RankPage = lazy(() => import('./pages/RankPage.jsx'));
export const InfoPage = lazy(() => import('./pages/InfoPage.jsx'));
export const MorePage = lazy(() => import('./pages/MorePage.jsx'));
export const SpeechPage = lazy(() => import('./pages/SpeechPage.jsx'));
export const ShopPage = lazy(() => import('./pages/ShopPage.jsx'));
export const SignupPage = lazy(() => import('./pages/SignUpPage.jsx'));