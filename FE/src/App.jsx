import React, { useEffect, Suspense } from "react";
import { useDispatch } from "react-redux";
import "./App.css";
import "./index.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  PracticePage,
  LearnPage,
  RankPage,
  InfoPage,
  MorePage,
  SpeechPage,
  TaskPage,
  ShopPage,
  LandingPage,
  SignupPage,
  LoginPage,
  NotFound404,
  ForbiddenPage,
} from "./lazy";
import AppAdmin from "./admin/AppAdmin.jsx";
import AppProviders from "./AppProviders.jsx";
import LessonSession from "./components/Sessions/LessonSession.jsx";
import RegisterAccountPage from "./user/pages/RegisterAccountPage.jsx";
import VerifyCodePage from "./user/pages/VerifyCodePage.jsx";
import { Toaster } from "react-hot-toast";
import { ChatWidget } from "./components/chat/ChatWidget.jsx";
import RoleplayChatDemo from "./components/chat/test.jsx";
import { hydrateFromCache, fetchMeSafe } from "./store/sessionSlice";
 import RouteGuard from "./components/RouteGuard.jsx";

const EXCLUDED_PATHS = [
  "/",
  "/admin",
  "/signup",
  "/register",
  "/login",
  "/verify",
  "/forbidden",
];

const GlobalChatWidget = () => {
  const location = useLocation();
  const { pathname } = location;

  // Kiểm tra xem path hiện tại có BẮT ĐẦU bằng bất kỳ path nào trong danh sách loại trừ không
  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

  if (isExcluded) {
    return null; // Không render gì cả trên các trang bị loại trừ
  }
  return (
    <ChatWidget title="Roleplay Assistant" badge="AI">
      <RoleplayChatDemo embedded defaultRole="student_b" autoStart />
    </ChatWidget>
  );
};

const LazyLoadingFallback = () => (
  <div className="grid min-h-screen w-full place-items-center bg-slate-50 text-slate-500">
    Đang tải trang...
  </div>
);

function App() {
  // Redux để tải user, giúp các "gác cổng" có data để kiểm tra
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateFromCache());
    const hasTokens =
      typeof window !== "undefined" &&
      (localStorage.getItem("access") || localStorage.getItem("refresh"));
    if (hasTokens) {
      dispatch(fetchMeSafe());
    }
  }, [dispatch]);
  return (
    <AppProviders>
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        
          <Routes>
            <Route element={<RouteGuard mode="guest"/>}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register/" element={<SignupPage />} />
              <Route path="/login/" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterAccountPage />} />
              <Route path="/verify" element={<VerifyCodePage />} />
            </Route>
            <Route element={<RouteGuard mode="user" />}>
              <Route path="/learn/session/:id" element={<LessonSession />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/speech" element={<SpeechPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/rank" element={<RankPage />} />
              <Route path="/task" element={<TaskPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<InfoPage />} />
              <Route path="/more" element={<MorePage />} />
            </Route>

            <Route element={<RouteGuard mode="admin" />}>
              <Route path="/admin/*" element={<AppAdmin />} />
            </Route>
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        <GlobalChatWidget />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
