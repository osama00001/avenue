"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

const AdminTable = ({
  columns,
  data,

  onEdit,
  onDelete,
  onView,

  showEdit = true,
  showDelete = true,
  showView = false,
}) => {
  /**
   * --------------------------------------------------
   * Inject ACTION column dynamically
   * --------------------------------------------------
   */
  const enhancedColumns = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original;

        return (
          <div className="flex gap-3 items-center">
            {/* VIEW */}
            {showView && (
              <button
                onClick={() => onView?.(record)}
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                title="View"
              >
                <FaEye size={19} />
              </button>
            )}

            {/* EDIT */}
            {showEdit && (
              <button
                onClick={() => onEdit?.(record)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                title="Edit"
              >
                <FaEdit size={19} />
              </button>
            )}

            {/* DELETE */}
            {showDelete && (
              <button
                onClick={() => onDelete?.(record)}
                className="text-red-600 hover:text-red-800 cursor-pointer"
                title="Delete"
              >
                <FaTrash size={19} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="w-full overflow-x-auto bg-white rounded border">
      <table className="w-full border-collapse text-sm">
        {/* HEADER */}
        <thead className="bg-[#ae0001] border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-semibold text-white cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " ▲",
                    desc: " ▼",
                  }[header.column.getIsSorted()] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* BODY */}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50 transition">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
