<script setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, genFileId } from 'element-plus'
import * as monaco from 'monaco-editor'
import { ref } from 'vue'
import { jsYamlToType, parserYaml } from '../../src'

let editorComponent = null
const upload = ref()
const optionOptions = ref([])
const selectVModel = ref('')
const yaml = ref(null)
function onExceed(files) {
  upload.value.clearFiles()
  const file = files[0]
  file.uid = genFileId()
  upload.value.handleStart(file)
}

function onSuccess(e) {
  const reader = new FileReader()
  reader.onload = async function (event) {
    const fileContent = event.target.result
    yaml.value = parserYaml(fileContent)
    optionOptions.value = Object.keys(yaml.value.paths)
    jsYamlToType(yaml.value).then((type) => {
      editorComponent.setValue(JSON.stringify(type, null, 2))
    })
  }
  reader.readAsText(e.raw)
}

monaco.editor.defineTheme('myTheme', {
  base: 'vs',
  inherit: true,
  rules: [{ background: 'EDF9FA', token: '' }],
  colors: {
    'editor.foreground': '#000000',
    'editor.background': '#EDF9FA',
    'editorCursor.foreground': '#8B0000',
    'editor.lineHighlightBackground': '#0000FF20',
    'editorLineNumber.foreground': '#008800',
    'editor.selectionBackground': '#88000030',
    'editor.inactiveSelectionBackground': '#88000015',
  },
})
monaco.editor.setTheme('myTheme')

const editor = ref(null)
onMounted(() => {
  editorComponent = monaco.editor.create(editor.value, {
    value: '',
    fontFamily: 'Arial',
    fontSize: 20,
    language: 'html',
    readOnly: true,
  })
  window.addEventListener('resize', () => {
    editorComponent.layout()
  })
  editorComponent.onMouseDown((e) => {
    const target = e.target.element.closest('.view-line')
    if (!target)
      return
    const content = target.textContent
    const index = content.indexOf(':')
    if (index === -1)
      return
    const key = content.slice(0, index).trim().replace(/^"|"$/g, '')
    const value = content.slice(index + 1, -1).trim().replace(/^"|"$/g, '')
    // 点击完把内容塞给粘贴板
    navigator.clipboard.writeText(value)
    ElMessage.success(`已复制 ${key} 的值`)
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', () => {
    editorComponent.layout()
  })
  editorComponent.dispose()
})
async function onChange(v) {
  if (v) {
    const d = await jsYamlToType(yaml.value, v)
    editorComponent.setValue(JSON.stringify(d, null, 2))
  }
}
</script>

<template>
  <el-upload
    ref="upload" :limit="1" drag :auto-upload="false" :on-exceed="onExceed" accept=".yaml"
    :on-change="onSuccess"
  >
    <el-icon class="el-icon--upload">
      <UploadFilled />
    </el-icon>
    <div class="el-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
  <el-select v-if="optionOptions.length" v-model="selectVModel" placeholder="指定某一个接口" clearable @change="onChange">
    <el-option v-for="item in optionOptions" :key="item" :value="item" :label="item" />
  </el-select>
  <div id="editor" ref="editor" />
</template>

<style scoped>
  #editor {
    height: 700px;
    width: 100%;
    margin-top: 20px;
  }
</style>
