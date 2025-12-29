export const adminColumns = {
    users: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "username", headerName: "Username", width: 160 },
      { field: "email", headerName: "Email", width: 220 },
      { field: "last_active", headerName: "Last Active", width: 180 },
    ],
    languages: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "name", headerName: "Name", width: 180 },
      { field: "abbreviation", headerName: "Abbr", width: 120 },
      { field: "native_name", headerName: "Native", width: 200 },
      { field: "direction", headerName: "Dir", width: 90 },
    ],
    topics: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "slug", headerName: "Slug", width: 160 },
      { field: "title", headerName: "Title", width: 220 },
      { field: "order", headerName: "Order", width: 90, type: "number" },
      { field: "golden", headerName: "Golden", width: 90, type: "boolean" },
    ],
    words: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "text", headerName: "Text", width: 200 },
      {field: "normalized", headerName: "Nor", width: 100},
      { field: "language", headerName: "Language", width: 100 },
      { field: "part_of_speech", headerName: "Part of Speech", width: 150 },
      { field: "definition", headerName: "Definition", width: 100},
      { field: "ipa", headerName: "IPA", width: 100},
      {field: "audio_url", headerName: "Audio URL", width: 100},
    ],
    roleplay: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "slug", headerName: "Slug", width: 150 },
      { field: "title", headerName: "Title", width: 250 },
      { field: "level", headerName: "Level", width: 100 },
      { field: "is_active", headerName: "Active", type: "boolean" },
    ],
    skills: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "title", headerName: "Title", width: 240 },
      { field: "type", headerName: "Type", width: 120 },
      { field: "language_code", headerName: "Lang", width: 100 },
      { field: "xp_reward", headerName: "XP", width: 90, type: "number" },
      { field: "difficulty", headerName: "Diff", width: 90, type: "number" },
      { field: "is_active", headerName: "Active", width: 90, type: "boolean" },
    ],
    notifications: [
      { field: "id", headerName: "ID", width: 70 },
      { field: "user", headerName: "User", width: 90 }, 
      { field: "type", headerName: "Type", width: 140 },
      { field: "title", headerName: "Title", width: 200 },
      { field: "body", headerName: "Body", width: 280 }, 
      { 
        field: "read_at", 
        headerName: "Read At", 
        width: 160,
        renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : "Unread"
      },
      { 
        field: "created_at", 
        headerName: "Created", 
        width: 160,
        renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : ""
      },
    ],
  };