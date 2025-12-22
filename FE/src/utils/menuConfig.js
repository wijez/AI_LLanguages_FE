import {
    Home,
    Volume2,
    Dumbbell,
    Shield,
    Briefcase,
    // Store,
    User,
    MoreHorizontal,
    PlusCircle,
    Newspaper,
    Settings,
    LogOutIcon,
    Search,
  } from "lucide-react";
  

  export const MAIN_MENU = [
    { icon: Home, i18nKey: "nav.learn", path: "/learn", badge: false },
    { icon: Volume2, i18nKey: "nav.pronunciation", path: "/speech", badge: false },
    { icon: Dumbbell, i18nKey: "nav.practice", path: "/practice", badge: true },
    { icon: Shield, i18nKey: "nav.rank", path: "/rank", badge: false },
    { icon: Briefcase, i18nKey: "nav.tasks", path: "/task", badge: true },
    // { icon: Store, i18nKey: "nav.shop", path: "/shop", badge: false },
    { icon: User, i18nKey: "nav.profile", path: "/profile", badge: false },
  ];
  

  export const MORE_ACTIONS = [
    { icon: PlusCircle, i18nKey: "nav.addLanguage", path: "/more" },
    { icon: Newspaper, i18nKey: "nav.newsfeed", path: "/newsfeed" },
    { icon: Search, i18nKey: "nav.friend", path: "/find-friends" },
    { icon: Settings, i18nKey: "nav.setting", path: "/setting" },
    { icon: LogOutIcon, i18nKey: "nav.logout", id: "logout" },
  ];
  

  export const MORE_MENU_ITEM = {
    icon: MoreHorizontal,
    i18nKey: "nav.more",
    id: "more",
    subMenu: MORE_ACTIONS,
  };