import React from "react";
import { columnsData } from "./columns";
import ReusableTable from "./table";

const TablePage = ({ bleData }) => (
  <div className="flex flex-col items-center">
    <div className="w-full max-w-6xl p-4">
      <ReusableTable
        tableColumns={columnsData}
        tableData={bleData}
        title="Response Data"
      />
    </div>
  </div>
);

export default TablePage;
