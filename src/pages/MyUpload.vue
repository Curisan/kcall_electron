<template>
  <el-container class="container">
     <el-main  ref="ul" id="main">
         <el-row type="flex" justify="center">
            <el-col :span=24>

                <!-- 点击上传按钮 -->
                <div>
                    <el-upload
                        class="upload-file"
                        action="#"
                        :before-upload="handle_before_upload"
                        :http-request="upload_file"
                        :show-file-list="false"
                        :file-list="uploadFileList">
                        <el-button size="small" type="primary">点击上传</el-button>
                        <div slot="tip" class="el-upload__tip">只能上传音频文件，音频时长不超过2小时（超过2小时只处理前2小时）</div>
                    </el-upload>
                </div>
                
                <!-- 选择文件语言对话框 -->
                <el-dialog
                    title="上传音视频文件"
                    :visible.sync="uploadDialogVisible"
                    width="40%"
                    :before-close="handleUploadDialogClose">
                    <el-card shadow="never">
                        <el-row>
                            <el-col :span=16>
                                {{uploadFileName}}
                            </el-col>
                            <el-col :span=8>
                                <el-row>
                                    <el-select v-model="languageValue" placeholder="请选择一种语言">
                                        <el-option
                                            v-for="item in languageOptions"
                                            :key="item.value"
                                            :label="item.label"
                                            :value="item.value">
                                        </el-option>
                                    </el-select>
                                </el-row>
                            </el-col>
                        </el-row>
                    </el-card>
                    <span slot="footer" class="dialog-footer">
                        <el-row type="flex" justify="end" :gutter="20">
                            <el-col :span=4>
                                <el-button @click="handleUploadDialogClose()">取消</el-button>
                            </el-col>
                            <el-col :span=4>
                                <el-button type="primary" :disabled='languageValue==""?true:false'  @click="hanldeUploadDialogSummit()">提交</el-button>
                            </el-col>
                        </el-row>
                    </span>
                </el-dialog>

                <!-- 文件列表 -->
                <el-table class="upload-table" :data="uploadTableData" style="width: 100%"
                    @row-click="handleUploadTableRowClick"
                    >
                    <el-table-column prop="filename" label="文件">
                         <template slot-scope="scope">
                            <div>
                                <span @click="handleFilenameClick(scope.$index, scope.row)">
                                    {{uploadTableData[scope.$index].filename}}
                                </span>
                            </div>
                            <div>
                                <span :class="uploadTableData[scope.$index].status==0?'upload-status-info-success':'upload-statue-info'" v-show='uploadTableData[scope.$index].upload_status_info!=""'>
                                    {{uploadTableData[scope.$index].upload_status_info}}{{uploadTableData[scope.$index].upload_propress}}
                                </span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="create_time" label="创建时间">
                    </el-table-column>
                    <el-table-column prop="operate" fixed="right" width="60" label="操作">
                        <template slot-scope="scope">
                            <i
                            class="el-icon-delete"
                            @click="handleUploadFileDelete(scope.$index, scope.row)"
                            ></i>
                        </template>
                    </el-table-column>
                </el-table>


            </el-col>
         </el-row>
     </el-main>
  </el-container>
</template>
<script>
import NarBar from "../components/NarBar.vue";
import axios from "axios";
import SparkMD5 from 'spark-md5';

export default {
    name: "MyUpload",
    data(){
        return {
            // 文件上传
            uploadFileList: [],
            uploadTableData: [],
            uploadFileName: "aaa.wav",
            uploadData: null,
            uploadProgress: 0,
            uploadFileMd5: "",
            // 选择语言
            uploadDialogVisible: false,
            languageValue: "",
            languageOptions: [{value: "zh", label: "普通话"},{value: "en", label: "英语"}],
            // 文件列表

            // 循环请求
            process_interval: null,
            trans_status_interval: null,
        }
    },
    components: {
        NarBar
    },
    created(){
        // 获取文件列表
        let that = this
        that.get_myupload_record()
    },
    beforeDestroy(){
        let that = this
        clearInterval(that.process_interval)
        clearInterval(that.trans_status_interval)
    },
    methods: {
        // 文件上传
        handle_before_upload(data){
            console.log("before upload: ", data)
            let that = this
            that.uploadData = data
            that.uploadFileName = data.name
            that.uploadDialogVisible = true 
        },
        upload_file(data){
            // console.log("upload_file: ", data)
            // console.log("uploadFileList: ", this.uploadFileList)

            // let that = this
            // var create_time = new Date().Format("yyyy-MM-dd hh:mm:ss");
            // that.uploadTableData.push({filename: data.file.name,
            //                            create_time: create_time})
        },

        // 选择语言对话框
        handleUploadDialogClose(){
            this.languageValue = ""
            this.uploadData = null
            this.uploadDialogVisible = false
            
        },
        hanldeUploadDialogSummit(){
            let that = this
            that.uploadDialogVisible = false
            // 获取MD5
            const fileReader = new FileReader()
            fileReader.readAsBinaryString(that.uploadData);
            fileReader.onload = e => {
                const md5 = SparkMD5.hashBinary(e.target.result);
                // 时间戳
                var create_time = new Date()
                var file_id = md5+create_time.getTime()
                var create_time = create_time.Format("yyyy-MM-dd hh:mm:ss");
                // 添加到文件列表中
                that.uploadTableData.reverse()
                that.uploadTableData.push({file_id: file_id,
                                        filename: that.uploadFileName,
                                        create_time: create_time,
                                        upload_status_info: "上传中...",
                                        upload_propress: ""})
                that.uploadTableData.reverse()

                console.log("uploadTableData: ", that.uploadTableData)
                // 文件上传    
                that.uploadFile(that.languageValue, create_time, file_id)
                // 重置参数
                that.languageValue = ""
                that.uploadData = null
            }      
        },
        uploadFile(language, create_time, file_id){
            let that  = this
            let formData = new FormData();
            formData.append("file", that.uploadData)
            formData.append("language",language)
            formData.append("create_time", create_time)
            formData.append("file_id", file_id)

            var access_token = localStorage.getItem("token")

            axios
            .post("/api/myupload_upload", formData,
            {
            headers: {
                'Authorization': `JWT ${access_token}`,
                "Content-Type": "multipart/form-data"
            },
            onUploadProgress: e => {
                var completeProgress = ((e.loaded / e.total * 100) | 0) + "%";
                that.updateUploadProcess(file_id, completeProgress);
            }})
            .then(function (response) {
                that.updateUploadProcess(file_id, "")
                console.log("myupload_upload: ", response.data);
                var res = response.data;
                if (res.code != 0) {
                    alert(res.msg)
                    console.log("myupload_upload failed: ", res.msg);
                    that.uploadStatusInfo = ""
                    that.deleteUploadFile(file_id)
                } else {
                    that.updateUploadStatusInfo(file_id, "处理中...")
                    var duration = res.duration
                    console.log("myupload_upload success")
                    // 处理进度显示
                    that.get_trans_process(file_id, duration)
                }
            })
            .catch(function (error) {
                console.log("uploadFile error: ", error)
                if(error.response.status==401){
                        that.$router.push({
                        path: "/",
                        })
                    }
                console.log(error);
            });
        },
        updateUploadStatusInfo(file_id, new_status_info){
            let that = this
            for(var ii=0; ii<that.uploadTableData.length; ii++){
                if(that.uploadTableData[ii].file_id==file_id){
                    that.uploadTableData[ii].upload_status_info=new_status_info
                }
            }
        },
        updateUploadProcess(file_id, completeProgress){
            let that = this
            for(var ii=0; ii<that.uploadTableData.length; ii++){
                if(that.uploadTableData[ii].file_id==file_id){
                    that.uploadTableData[ii].upload_propress=completeProgress
                }
            }
        },
        updateUploadStatus(file_id, status){
            let that = this
            for(var ii=0; ii<that.uploadTableData.length; ii++){
                if(that.uploadTableData[ii].file_id==file_id){
                    that.uploadTableData[ii].status=status
                }
            }
        },
        deleteUploadFile(file_id){
            let that = this
            let idx = -1
            for(var ii=0; ii<that.uploadTableData.length; ii++){
                if(that.uploadTableData[ii].file_id==file_id){
                    idx = ii
                    break
                }
            }
            that.uploadTableData.splice(idx, 1)
        },
        get_trans_process(file_id, duration){
            console.log("duration: ", duration)
            if(duration>7200){
                duration = 7200
            }
            let that = this
            var rtf = 0.3 // 实时率
            var time_use = Math.floor(duration*rtf)
            var time_inter = 1000
            var percent_delta = 100/(time_use*1000/time_inter)
            console.log("percent_delta: ", percent_delta)
            var percent = 0
            that.updateUploadProcess(file_id, "0%")
            that.process_interval = setInterval(function(){
                percent += percent_delta
                if(percent>99){
                    percent=99
                    clearInterval(that.process_interval)
                    that.updateUploadProcess(file_id, Math.floor(percent)+"%")
                    // 获取后端数据
                    that.get_trans_result(file_id)
                }else{
                    that.updateUploadProcess(file_id, Math.floor(percent)+"%")
                }
            }, time_inter)
        },
        get_trans_result(file_id){
            console.log("get_trans_result start...")
            let that = this
            var time_inter = 10000
            that.trans_status_interval = setInterval(function(){
                var access_token = localStorage.getItem("token")
                axios
                .post("/api/myupload_get_status", {
                    file_id: file_id
                },
                {
                headers: {
                    'Authorization': `JWT ${access_token}`
                }})
                .then(function (response) {
                    console.log("myupload_get_status: ", response.data);
                    var res = response.data;
                    if (res.code != 0) {
                        alert(res.msg)
                        console.log("myupload_upload failed: ", res.msg);
                    } else {
                        var upload_status_info = that.convert_upload_status_info(res.status, res.duration)
                        that.updateUploadStatusInfo(file_id, upload_status_info)
                        that.updateUploadStatus(file_id, res.status)
                        if(res.status!=1){
                            clearInterval(that.trans_status_interval)
                            that.updateUploadProcess(file_id, "")
                        }
                    }
                })
                .catch(function (error) {
                    console.log("myupload_get_status error: ", error)
                    if(error.response.status==401){
                            that.$router.push({
                            path: "/",
                            })
                        }
                    console.log(error);
                });
            }, time_inter)
        },


        // 文件表格
        handleFilenameClick(index, row) {
            console.log(index);
        },
        handleUploadTableRowClick(row, column,  event){
            let that = this
            if(row.status!=0){
                return
            }
            console.log("file_id: ", row.file_id)
            localStorage.setItem("file_id", row.file_id)
            that.$router.push({
                path: "/meetingtrans",
            });
        },
        handleUploadFileDelete(index, row){
            let that = this
            this.$confirm('确认删除？')
            .then(_ => {
              // 调用接口删除用户
              that.file_del(that.uploadTableData[index].file_id, index)
              done();
            })
            .catch(_ => {});
        },
        file_del(file_id, index){
            let that = this
            var access_token = localStorage.getItem("token")
            axios
            .post("/api/myupload_delete", {
                file_id: file_id,
            },
            {
                headers: {
                'Authorization': `JWT ${access_token}`
            }})
            .then(function (response) {
                var res = response.data;
                if (res.code != 0) {
                    alert(res.msg);
                } else {
                    that.uploadTableData.splice(index, 1)
                }
                })
            .catch(function (error) {
                if(error.response.status==401){
                  that.$router.push({
                    path: "/",
                  })
                }
                alert(error);
            });
        },

        // 工具函数
        get_myupload_record(){
            let that = this
            that.uploadTableData = [];
            var access_token = localStorage.getItem("token")
            axios
            .get("/api/myupload_record",
            {
            headers: {
                'Authorization': `JWT ${access_token}`
            }})
            .then(function (response) {
                console.log("get_myupload_record record list: ", response.data.myupload_record_list);
                var record_list = response.data.myupload_record_list;
                for (var ii = 0; ii < record_list.length; ii++) {
                    var idata = {
                        file_id: record_list[ii].file_id,
                        filename: record_list[ii].filename,
                        create_time: record_list[ii].create_time,
                        status: record_list[ii].status,
                        upload_status_info: that.convert_upload_status_info(record_list[ii].status, record_list[ii].duration),
                    };
                    that.uploadTableData.push(idata);
                }
                that.uploadTableData.reverse();
                console.log("uploadTableData: ", that.uploadTableData)
            })
            .catch(function (error) {
                console.log("get_myupload_record record error: ", error)
                if(error.response.status==401){
                that.$router.push({
                    path: "/",
                })
                }
                console.log(error);
            });
        },
        convert_upload_status_info(upload_status_info, duration){
            if(upload_status_info==0){
                return this.convert_duration(Math.floor(duration))
            }else if(upload_status_info==1){
                return "处理中..."
            }else if(upload_status_info==2){
                return "处理失败"
            }
        },
        convert_duration(duration){
            if(duration>=3600){
                var hh = Math.floor(duration/3600)
                var mm = Math.floor((duration-hh*3600)/60)
                var ss = duration-hh*3600-mm*60
                return hh+"时 "+mm+"分 "+ss+"秒"
            }else if(duration>=60){
                var mm = Math.floor(duration/60)
                var ss = duration-mm*60
                return mm+"分 "+ss+"秒"
            }else{
                return duration+"秒"
            }
        }
    }
}



Date.prototype.Format = function (fmt) { // author: meizz
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "h+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
}
</script>
<style>

/* 文件列表 */
.upload-table{
    cursor: pointer;
}
.upload-statue-info {
    font-size: 12px;
    color: red;
}
.upload-status-info-success{
    font-size: 12px;
    color: black;    
}
</style>
