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
export const Friend = lazy(()=> import('./components/Contents/Friend.jsx'));

// Pages
export const LandingPage = lazy(() => import('./user/pages/LandingPage.jsx'));
export const TaskPage = lazy(() => import('./user/pages/TaskPage.jsx'));
export const PracticePage = lazy(() => import('./user/pages/PracticePage.jsx'));
export const LearnPage = lazy(() => import('./user/pages/LearnPage.jsx'));
export const RankPage = lazy(() => import('./user/pages/RankPage.jsx'));
export const InfoPage = lazy(() => import('./user/pages/InfoPage.jsx'));
export const MorePage = lazy(() => import('./user/pages/MorePage.jsx'));
export const SpeechPage = lazy(() => import('./user/pages/SpeechPage.jsx'));
export const ShopPage = lazy(() => import('./user/pages/ShopPage.jsx'));
export const SignupPage = lazy(() => import('./user/pages/SignUpPage.jsx'));
export const LoginPage = lazy(() => import('./user/pages/LoginPage.jsx'));
export const NotFound404 = lazy(() => import('./components/NotFound404.jsx'))
export const ForbiddenPage = lazy(() => import('./user/pages/ForbiddenPage.jsx'))
