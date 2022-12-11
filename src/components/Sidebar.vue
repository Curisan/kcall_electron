<template>
    <div class="sidebar">
        <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="collapse" background-color="#333b57" text-color="#bfcbd9" active-text-color="#20a0ff" unique-opened router>
            <template v-for='item in items'>
                <el-menu-item :index="item.index">
                    <i :class="item.icon"></i>
                    <span slot="title">{{ item.title }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </div>
</template>

<script>
import bus from "../components/bus";
export default {
    data() {
        return {
            collapse: true,
            items: [
                {
                    icon: "el-icon-folder",
                    index: "mycontent",
                    title: "我的内容",
                },
                {
                    icon: "el-icon-delete",
                    index: "recycle",
                    title: "回收站",
                },
            ],
        };
    },
    computed: {
        onRoutes() {
            return this.$route.path.replace("/", "");
        },
    },
    created() {
        // 通过 Event Bus 进行组件间通信，来折叠侧边栏
        bus.$on("collapse", (msg) => {
            this.collapse = msg;
            bus.$emit("collapse-content", msg);
        });
    },
    methods: {
        // 侧边栏折叠
        collapseChage() {
            this.collapse = !this.collapse;
            bus.$emit("collapse", this.collapse);
        },
    },
};
</script>

<style scoped>
.sidebar {
    display: block;
    position: absolute;
    left: 0;
    top: 45px;
    bottom: 0;
    overflow-y: scroll;
}

.logo {
    height: 45px;
    width: 100%;
    background-color: #324157;
    padding: 10px 10px 10px 20px;
    box-sizing: border-box;
    -webkit-transition: padding 0.3s ease-in-out;
    transition: padding 0.3s ease-in-out;
}

.login-collapse {
    padding: 10px 0px 10px 5px;
}

.logo img {
    height: 50px;
    width: 50px;
    float: left;
}

.logo span {
    line-height: 50px;
    color: #bfcbd9;
    font-size: 20px;
    margin-left: 5px;
    -webkit-transition: display 1.3s ease-in-out;
    transition: display 1.3s ease-in-out;
}

.span-collapse {
    display: none;
}
.sidebar::-webkit-scrollbar {
    width: 0;
}
.sidebar-el-menu:not(.el-menu--collapse) {
    width: 250px;
}

.sidebar-el-menu:is(.el-menu--collapse) {
    width: 55px;
}
.sidebar > ul {
    height: calc(100vh - 45px); 
}

.collapse-btn {
    position: absolute;
    bottom: 10px;
    right: 25px;
    /* padding: 0 15px; */
    cursor: pointer;
    color: white;
}

/* .collapse-btn-collapse {
    left: 200px;
} */
</style>
