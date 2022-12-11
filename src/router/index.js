import Vue from 'vue'
import Router from 'vue-router'

import Login from '../pages/Login.vue'
import MyContent from '../pages/MyContent.vue'
import Recycle from '../pages/Recycle.vue'
import Home from '../pages/Home.vue'

Vue.use(Router)

export default new Router({
    mode: "history",
    routes: [
        {
            path: "/",
            redirect: "/login"
        },
        {
            path: '/home',
            redirect: '/mycontent'
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/home',
            name: 'home',
            component: Home,
            children: [
                {
                    path: "/mycontent",
                    name: "mycontent",
                    component: MyContent
                },
                {
                    path: "/recycle",
                    name: "recycle",
                    component: Recycle
                }
            ]
        }
    ]
})