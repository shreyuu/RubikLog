import React from "react";

const DeleteButton = ({ onClick, isDeleting }) => {
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this solve?")) {
      try {
        await onClick();
      } catch (err) {
        alert("Failed to delete solve. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`
                relative inline-flex items-center justify-center px-4 py-2
                text-red-500 rounded-lg group
                transition-all duration-300 ease-in-out
                ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                before:absolute before:inset-0
                before:rounded-lg before:border-2 before:border-transparent
                before:transition-all before:duration-500 before:ease-out
                hover:before:border-red-500
                hover:before:scale-105
                hover:text-red-600
            `}
    >
      <span className="relative z-10">{isDeleting ? 'Deleting...' : 'Delete'}</span>
    </button>
  );
};

export default DeleteButton;
