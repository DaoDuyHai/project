export const errorHandler = (error, req, res, next) => {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    message: error.message || "Đã có lỗi xảy ra trên server.",
  });
};
