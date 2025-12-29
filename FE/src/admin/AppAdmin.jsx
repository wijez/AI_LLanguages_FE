import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { adminColumns } from "./components/constants/adminColumns";
import { resourceConfigs } from "./components/constants/resourceConfigs"; 
import Dashboard from "./components/Dashboard";
import GenericResourcePage from "./pages/GenericResourcePage"; 
import TopicsPage from "./pages/TopicsPage"; 
import WordsPage from "./pages/WordsPage";

import TopicDetail from "./components/TopicDetail";
import SkillDetail from "./pages/SkillDetail";
import SkillEditor from "./components/SkillEditor";
import RoleplayDetail from "./components/RoleplayDetail";
import RolePlayBlockDetails from "./components/RolePlayBlockDetails";

export default function AppAdmin() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        
        <Route 
          path="users" 
          element={<GenericResourcePage columns={adminColumns.users} config={resourceConfigs.users} />} 
        />

        <Route 
          path="languages" 
          element={<GenericResourcePage columns={adminColumns.languages} config={resourceConfigs.languages} />} 
        />

        <Route 
          path="topics" 
          element={<TopicsPage columns={adminColumns.topics} />} 
        />
        <Route path="topics/:id" element={<TopicDetail />} />

        <Route
          path="skills"
          element={<GenericResourcePage columns={adminColumns.skills} config={resourceConfigs.skills} />}
        />
        <Route path="skill/:id" element={<SkillDetail />} />
        <Route path="skill/:id/edit" element={<SkillEditor />} />

        <Route 
          path="words" 
          element={<WordsPage columns={adminColumns.words} config={resourceConfigs.words} />} 
        />

        <Route 
          path="roleplay" 
          element={<GenericResourcePage columns={adminColumns.roleplay} config={resourceConfigs.roleplay} />} 
        />
        <Route path="roleplay/:id" element={<RoleplayDetail />} />
        <Route path="roleplay-block/:id" element={<RolePlayBlockDetails />} />

        <Route
          path="notifications"
          element={<GenericResourcePage columns={adminColumns.notifications} config={resourceConfigs.notifications} />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}