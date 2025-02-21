import React from "react";

const DeleteButton = ({ onClick }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this solve?")) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className={`
                relative inline-flex items-center justify-center px-4 py-2
                text-red-500 rounded-lg group
                transition-all duration-300 ease-in-out
                before:absolute before:inset-0
                before:rounded-lg before:border-2 before:border-transparent
                before:transition-all before:duration-500 before:ease-out
                hover:before:border-red-500
                hover:before:scale-105
                hover:text-red-600
            `}
    >
      <span className="relative z-10">Delete</span>
    </button>
  );
};

export default DeleteButton;
