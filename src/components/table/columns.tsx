import React from "react";

interface ColumnType {
  Header: string;
  accessor: string;
  sortType: string;
  Cell?: any;
}
export const columnsData: ColumnType[] = [
  {
    Header: "No",
    accessor: "",
    Cell: ({ row }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-700">
        {row.index + 1}
      </span>
    ),
    sortType: "basic",
  },
  {
    Header: "Address",
    accessor: "macAddress",
    sortType: "basic",
    Cell: ({ value }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
        {value}
      </span>
    ),
  },
  {
    Header: "Full Name",
    accessor: "fullName",
    sortType: "basic",
    Cell: ({ value }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
        {value}
      </span>
    ),
  },
  {
    Header: "Product Name",
    accessor: "productName",
    sortType: "basic",
    Cell: ({ value }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
        {value}
      </span>
    ),
  },
  {
    Header: "Product ID",
    accessor: "productId",
    sortType: "basic",
    Cell: ({ value }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
        {value}
      </span>
    ),
  },
  {
    Header: "TimeStamp",
    accessor: "timestampNanos",
    sortType: "basic",
    Cell: ({ value }: any) => (
      <span className="py-3.5 px-4 text-sm font-medium text-gray-800">
        {value}
      </span>
    ),
  },
  {
    Header: "Connection",
    accessor: "isConnected",
    Cell: ({ value }: any) => (
      <span
        className={`${
          value
            ? "bg-green-500 text-white p-2 rounded-md"
            : "bg-red-500 text-white p-2 rounded-md"
        }`}
      >
        {value ? "Conneted" : "Not Connected"}
      </span>
    ),
    sortType: "basic",
  },
];


export const bleData = [
  {
    address: "123 Main St",
    fullName: "John Doe",
    productName: "Product A",
    productId: "001",
    timestampNanos: "2024-07-25T12:34:56Z",
    isConnected: true,
  },
  {
    address: "456 Elm St",
    fullName: "Jane Smith",
    productName: "Product B",
    productId: "002",
    timestampNanos: "2024-07-25T14:56:78Z",
    isConnected: false,
  },
  // Add more data objects as needed...
];
