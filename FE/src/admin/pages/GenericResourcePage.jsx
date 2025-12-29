import * as React from "react";
import { useNavigate } from "react-router-dom";
import ResourceTable from "../components/ResourceTable"; 

/**
 * Trang hiển thị bảng dữ liệu chung (Generic).
 * * Props:
 * - columns: Mảng định nghĩa cột (lấy từ adminColumns).
 * - config: Object chứa cấu hình (title, resource, form, detailPath, ...).
 */
export default function GenericResourcePage({ columns, config }) {
  const navigate = useNavigate();

  // Nếu có detailPath trong config thì tạo hàm chuyển trang khi bấm View
  const handleViewRow = config.detailPath
    ? (row) => navigate(`${config.detailPath}/${row.id}`)
    : undefined;

  return (
    <ResourceTable
      title={config.title}
      resource={config.resource}
      columns={columns}
      form={config.form || []} // Nếu không có form thì truyền mảng rỗng
      transformPayload={config.transformPayload}
      onViewRow={handleViewRow}
      // Các props khác (searchParam, searchPlaceholder) có thể thêm vào config nếu cần
    />
  );
}