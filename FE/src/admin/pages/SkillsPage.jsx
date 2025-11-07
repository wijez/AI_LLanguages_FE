import * as React from "react";
import { useNavigate } from "react-router-dom";
import ResourceTable from "../components/ResourceTable";

const SKILL_TYPES = [
  { value: "listening", label: "Listening" }, 
  { value: "speaking", label: "Speaking" }, 
  { value: "reading", label: "Reading" }, 
  { value: "writing", label: "Writing" }, 
  { value: "matching", label: "Matching" }, 
  { value: "fillgap", label: "Fill in the blanks" }, 
  { value: "ordering", label: "Reorder words" }, 
  { value: "quiz", label: "Generic MCQ/QA" }, 
  { value: "pron", label: "Pronunciation" }, 
];

export default function SkillsPage() {
  const navigate = useNavigate();

  // Cột cho bảng Skill
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "title", headerName: "Title", width: 300 },
    { field: "type", headerName: "Type", width: 150 }, 
    { field: "xp_reward", headerName: "XP", width: 80 }, 
    { field: "is_active", headerName: "Active", type: "boolean", width: 100 }, 
  ];

  // Form để tạo/sửa Skill
  const form = [
    { name: "title", label: "Title", required: true }, 
    {
      name: "type",
      label: "Skill Type", 
      type: "select",
      options: SKILL_TYPES,
      required: true,
    },
    { name: "xp_reward", label: "XP Reward", type: "number", defaultValue: 10 }, 
    {
      name: "duration_seconds",
      label: "Duration (seconds)",
      type: "number",
      defaultValue: 90, 
    },
    {
      name: "difficulty",
      label: "Difficulty (1-5)",
      type: "number",
      defaultValue: 1, 
    },
    {
      name: "language_code",
      label: "Language Code (en, vi...)",
      defaultValue: "en", 
    },
    {
      name: "is_active",
      label: "Is Active",
      type: "boolean",
      defaultValue: true,
    }, 
  ];

  const handleViewSkill = (row) => {
    // Điều hướng đến trang chi tiết, mang theo `type` để render động
    navigate(`/admin/skill/${row.id}?type=${row.type}`);
  };

  return (
    <ResourceTable
      title="Skill Bank"
      resource="/skills/"
      columns={columns}
      form={form}
      onViewRow={handleViewSkill} 
    />
  );
}
