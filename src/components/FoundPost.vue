<template>
  <q-item class="col-12" clickable v-ripple @click="onClick">
    <q-item-section class="col-2" avatar>
      <q-icon color="secondary" name="picture_as_pdf" />
    </q-item-section>

    <q-item-section class="col-10">
      <q-item-label caption lines="1">
        {{ post.caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
  <!-- Pdfjs viewer dialog -->
  <pdf-viewer :post="post" :showDialog="showPdfViewer" @hideDialog="hidePdfViewer" />
</template>

<script>
import { defineComponent } from 'vue'
import PdfViewer from './PdfViewer.vue'
export default defineComponent({
  components: { PdfViewer },
  name: 'SinglePost',
  props: {
    post: Object,
    name: String,
  },
  data() {
    return {
      showPdfViewer: false,
    }
  },
  methods: {
    onClick() {
      this.showPdfViewer = true
    },
    hidePdfViewer(value) {
      this.showPdfViewer = value
    },
    djidj() {
      console.log('djidj.')
    },
    setParams() {
      this.src = `../catalogues/${this.post.fileUrl.split('\\').pop()}`
      console.log('setParams executed.')
    },
  },
  computed() {
    this.setParams()
  },
})
</script>

<style lang="sass"></style>
