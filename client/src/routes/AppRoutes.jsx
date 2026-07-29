import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/customer/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },

      {
        path: "shop",
        element: <h1>Shop Page</h1>,
      },

      {
        path: "categories",
        element: <h1>Categories Page</h1>,
      },

      {
        path: "seller",
        element: <h1>Become Seller</h1>,
      },
    ],
  },
]);

export default router;
