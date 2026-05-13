import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/store/userSlice";
import bookReducer from "@/store/bookSlice";
import adminReducer from "@/store/adminSlice";
import cartReducer from "@/store/cartSlice";
import userCategorySlice from "@/store/userCategorySlice";
import categoryReducer from "@/store/categorySlice";
import productReducer from "@/store/productSlice";
import adminUserSlice from "@/store/adminUserSlice";
import orderReducer from "@/store/orderSlice";
import addressReducer from "@/store/addressSlice";
import adminOrderReducer from "@/store/adminOrderSlice";
import dashboardReducer from "@/store/adminDashboardSlice";
import cmsReducer from "@/store/cmsSlice";
import socialReducer from "@/store/socialSlice";
import navigationReducer from "@/store/navigationSlice";
import adminBlogCategoriesReducer from "@/store/blogAdminCategorySlice";
import adminBlogReducer from "@/store/blogAdminSlice";
import blogReducer from "@/store/blogSlice";
export const store = configureStore({
  reducer: {
    user: userReducer,
    book: bookReducer,
    admin: adminReducer,
    cart: cartReducer,
    userCategory: userCategorySlice,
    category: categoryReducer,
    products: productReducer,
    adminUsers: adminUserSlice,
    orders: orderReducer,
    address: addressReducer,
    adminOrders: adminOrderReducer,
    dashboard: dashboardReducer,
    cms: cmsReducer,
    social: socialReducer,
    navigation: navigationReducer,
    adminBlogCategories: adminBlogCategoriesReducer,
    adminBlogs: adminBlogReducer,
    blog: blogReducer,
  },
});
