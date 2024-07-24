import React from "react";
import ReusableTable from "./table";
import { columnsData } from "./columns";

const TablePage = ({ bleData }) => (
  <div className="absolute inset-0 flex flex-col justify-around items-center bg-black">
    <div className="flex-1 h-4/5 flex flex-col flex-wrap mt-2">
      <ReusableTable
        tableColumns={columnsData}
        tableData={bleData}
        title={"Response Data"}
      />
    </div>
  </div>
);

export default TablePage;
