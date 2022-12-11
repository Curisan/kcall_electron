<template>
    <div class="wrapper">
        <v-head></v-head>
        <v-sidebar></v-sidebar>
        <div class="content-box" :class="{'content-collapse':collapse}">
            <div class="content">
                <transition name="move" mode="out-in">
                    <keep-alive>
                        <router-view></router-view>
                    </keep-alive>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
import vHead from "../components/Header.vue";
import vSidebar from "../components/Sidebar.vue";
import bus from "../components/bus";
import MyUpload from "../pages/MyUpload.vue"

export default {
    name: "Home",
    data() {
        return {
            collapse: true,
        };
    },
    components: {
        vHead,
        vSidebar,
        MyUpload,
    },
    created() {
        // 通过 Event Bus 进行组件间通信，来折叠侧边栏
        bus.$on("collapse", (msg) => {
            this.collapse = msg;
            bus.$emit("collapse-content", msg);
        });
    },
};
</script>
<style scoped>
.wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.content-box {
    position: absolute;
    left: 250px;
    top: 70px;
    bottom: 0;
    right: 0;
    -webkit-transition: left 0.3s ease-in-out;
    transition: left 0.3s ease-in-out;
    /* min-width: 800px; */
    /* background: #f0f0f0; */
}
.content-collapse {
    left: 64px;
}

.content{
    width: auto;
    height: 100%;
    padding: 10px 0 0 10px;
    box-sizing: border-box;
    overflow-y: hidden;
}
</style>
