<template>
    <el-row type="flex" justify="start">
        <el-col :span="1">
            <!-- <el-button @click="handleBack()" icon="el-icon-arrow-left" circle></el-button>
             -->
            <i class="el-icon-arrow-left" @click="handleBack()"></i>
        </el-col>
    </el-row>
</template>
<script>
export default {
    name: "NarBar",
    methods: {
        handleBack(){
            // this.$router.push({
            //     path: "/recordansys",
            // });
            this.$router.go(-1)
        }
    }
}
</script>
<style>
    .el-icon-arrow-left{
        padding-top: 10px;
        cursor: pointer;
        font-size: 32px;
    }
</style>
