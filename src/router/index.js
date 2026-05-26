import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layout/AdminLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Orders from '../views/Orders.vue'
import Products from '../views/Products.vue'
import Categories from '../views/Categories.vue'
import FlashSale from '../views/FlashSale.vue'
import Coupons from '../views/Coupons.vue'

const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'orders', component: Orders },
      { path: 'products', component: Products },
      { path: 'categories', component: Categories },
      { path: 'flash-sale', component: FlashSale },
      { path: 'coupons', component: Coupons }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router