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
    "sortType" : "basic"
  },
  {
    Header: "Address",
    accessor: "address",
    sortType: "basic"
  },
  {
    Header: "Full Name",
    accessor: "fullName",
    sortType: "basic"
  },
  {
    Header: "Product Name",
    accessor: "productName",
    sortType: "basic"
  },
  {
    Header: "Product ID",
    accessor: "productId",
    sortType: "basic"
  },
  {
    Header: "TimeStamp",
    accessor: "timestampNanos",
    sortType: "basic"
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
        {value ? "True" : "Not Dispatched"}
      </span>
    ),
    sortType: "basic"
  },
  
];
