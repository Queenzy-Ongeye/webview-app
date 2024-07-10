import React, { useMemo, useState, useRef } from "react";

import {
  useTable,
  Column,
  useSortBy,
  useGlobalFilter,
  useAsyncDebounce,
  usePagination,
} from "react-table";

import { BsArrowRight, BsArrowLeft } from "react-icons/bs";
import { HiOutlineSearch } from "react-icons/hi";
import "regenerator-runtime";

const ReusableTable = ({ tableColumns, tableData, title }) => {
  const data = useMemo(() => tableData, [tableData]);
  const columns = useMemo(() => tableColumns, [tableColumns]);

  const tableRef = useRef(null);

  const tableInstance = useTable(
    { columns, data },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    globalFilter,
    setGlobalFilter,
    page,
    nextPage,
    rows: tableRows,
    previousPage,
    canPreviousPage,
    canNextPage,
    pageOptions,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;

  const [value, setValue] = useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  //============ Start Pagination ===============
  const onPrevious = () => {
    previousPage();
  };
  const onNext = () => {
    nextPage();
  };
  //============== End Pagination ===============
  
  return (
    <section className="w-full ">
      <div className="border border-gray-200  md:rounded-lg my-1 bg-gray-100">
        <div className="flex items-center justify-between  p-4">
          <h3 className=" ml-4 text-xl font-bold text-black">{title}</h3>
          <div className="flex  items-center">
            <div className="relative ">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiOutlineSearch />
              </div>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => {
                  setValue(e.target.value);
                  onChange(e.target.value);
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-40 sm:w-80 md:w-120 pl-10 p-2.5"
                placeholder="Search for items..."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white border border-gray-200  md:rounded-lg">
        <table
          {...getTableProps()}
          className="min-w-full divide-y divide-gray-200"
          ref={tableRef}
        >
          <thead className="bg-gray-50">
            {headerGroups.map((headerGroup, index) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={`${column.id}-${index}`}
                    className="py-3.5 px-4 text-sm sm:text-md md:text-lg font-bold text-left rtl:text-right text-gray-700"
                  >
                    {column.render("Header")}
                    <span className="ml-2 text-sm font-normal">
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <span className="opacity-100">↓</span>
                        ) : (
                          <span className="opacity-100">↑</span>
                        )
                      ) : (
                        <span className="opacity-10 hover:opacity-100 ">
                          ↓↑
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            {...getTableBodyProps()}
            className="bg-white divide-y divide-gray-200"
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  key={row.id}
                  className={`hover:bg-gray-200 cursor-pointer`}
                >
                  {row.cells.map((cell) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={`${cell.column.id}-${row.id}`}
                        className="py-4 px-4 text-sm font-medium text-gray-700  whitespace-nowrap "
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between border border-gray-200  md:rounded-lg my-1 p-2 bg-white">
        <div className="flex items-center gap-8">
          <button
            className={`flex items-center px-5 py-2 text-sm capitalize transition-colors duration-200 border rounded-md gap-x-2
            text-gray-700  bg-gray-100 border-gray-200  hover:border-orange-300
          `}
            onClick={onPrevious}
            disabled={!canPreviousPage}
          >
            <BsArrowLeft />

            <span>previous</span>
          </button>
          <div className="text-sm">
            <span className="text-sm mr-2">Page</span>
            <strong>{pageIndex + 1}</strong>
            <span className="text-sm mx-2">of</span>
            <strong>{pageOptions.length}</strong>
          </div>
        </div>
        {/* ===================Start Pagination Range================ */}
        <div></div>
        {/* ===================End Pagination Range================ */}
        <div className="flex gap-8">
          <div className="hidden md:block text-sm">
            <span className="text-sm mr-2">Show</span>
            <select
              className="bg-gray-50 border border-f4e-orange text-gray-900 text-sm rounded-md py-1.5 focus:outline-none focus:ring-f4e-green focus:border-f4e-green selection:bg-f4e-green "
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
            >
              {[10, 25, 50, 100, 200, 400, 800].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <span className="text-sm ml-2">rows</span>
          </div>

          <button
            disabled={!canNextPage}
            onClick={onNext}
            className={`flex items-center px-5 py-2 text-sm capitalize transition-colors duration-200 border rounded-md gap-x-2
            text-gray-700  bg-gray-100 border-gray-200  hover:border-orange-300`}
          >
            <span>Next</span>

            <BsArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReusableTable;
