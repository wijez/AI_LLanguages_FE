import { createSelector } from '@reduxjs/toolkit';


const TZ = 'Asia/Ho_Chi_Minh';
const fmt = (iso) => {
if (!iso) return 'Never';
const d = new Date(iso);
const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: TZ });
const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TZ });
return `${date} at ${time}`;
};


const selectSession = (s) => s.session;
export const selectUser = createSelector(selectSession, (s) => s.user);
export const selectUserView = createSelector(selectSession, (s) => {
const u = s.user;
if (!u) return null;
return {
...u,
role: u.is_superuser ? 'Super Admin' : (u.is_staff ? 'Admin' : 'User'),
_fmt: {
date_joined: fmt(u.date_joined),
last_active: fmt(u.last_active),
last_login: fmt(u.last_login),
},
_meta: { fromCache: s.fromCache, offline: s.offline, lastSync: s.lastSync },
};
});