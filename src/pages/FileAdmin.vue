<template>
  <q-page class="constrain q-pa-md">
    <q-item>
      <div class="col-1 q-gutter-lg q-pr-sm"></div>
      <div class="col-2 q-gutter-lg q-pr-sm">
        <q-file
          name="cover_files"
          v-model="fileUpload"
          @input="uploadFile"
          color="black"
          :bg-color="buttonColor"
          filled
          multiple
          use-chips
          borderless
          dense
          hide-bottom-space
          label="Select file"
          indicator-color="transparent"
        >
          <template v-slot:prepend>
            <q-icon name="attachment" />
          </template>
        </q-file>
      </div>

      <div class="col-8">
        <q-input v-model="post.caption" class="col col-sm-8" label="Caption *" dense />
      </div>
      <div class="col-1 q-gutter-lg q-p-sm">
        <q-btn
          flat
          round
          :color="pawstButtonColor"
          icon="pets"
          :disable="!post.caption.length || !post.file"
          @click="pawst"
        />
      </div>
    </q-item>

    <q-item class="row justify-center q-gutter-sm q-p-sm">
      <div>
        <q-btn
          icon="pets"
          label="Reload"
          stack
          dense
          color="secondary"
          @click="refreshAllFiles"
        />
      </div>
      <div>
        <q-btn
          icon="delete"
          label="Delete All"
          stack
          dense
          color="secondary"
          @click="deleteAllData"
        />
      </div>
    </q-item>

    <div class="col-12">
      <q-item-label header>Uploaded files</q-item-label>

      <q-list bordered separator :class="uploaded">
        <template v-if="!loadingPosts && posts.length">
          <single-post v-for="post in posts" :key="post.id" :post="post" />
        </template>

        <template v-else-if="!loadingPosts && !posts.length">
          <no-posts />
        </template>
        <template v-else>
          <skeleton-post />
        </template>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { uid } from 'quasar'
import { ref } from 'vue'
import SinglePost from '../components/SinglePost.vue'
import SkeletonPost from '../components/SkeletonPost.vue'
import NoPosts from '../components/NoPosts.vue'
export default defineComponent({
  components: { SinglePost, SkeletonPost, NoPosts },
  name: 'FileUpload',
  setup() {
    return {
      files: ref(null),
      buttonColor: 'secondary',
    }
  },
  data() {
    return {
      // load
      posts: [],
      loadingPosts: false,
      uploaded: 'rounded',
      // upload
      post: {
        id: uid(),
        caption: '',
        location: '',
        date: Date.now(),
        file: null,
      },
      buttonColor: 'secondary',
      // v-model of q-file, this is where files get stored
      fileUpload: [],
      apiOsMap: 'https://nominatim.openstreetmap.org/',
      loadingLocation: false,
      // view
      pdfLink: '',
    }
  },
  methods: {
    refreshAllFiles() {
      this.$q.loading.show({
        message: 'Refreshing databases...',
      })
      this.$axios
        .post(`${process.env.API}/refresh-all-files`, {})
        .then((response) => {
          // this.$router.push('/')
          // notify about posting
          this.$q.notify({
            message: 'Refresh done.',
            actions: [
              {
                label: 'Dismiss',
                color: 'primary',
              },
            ],
          })
        })
        .catch((err) => {
          console.log('error ', err)
          this.$q.dialog({
            title: 'Error',
            message: 'Refresh failed.',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
    // deletes all data from firestore and typesense
    deleteAllData() {
      console.log('I log the djidja')
      this.$q.loading.show({
        message: 'Deleting data...',
      })

      this.$axios
        .delete(`${process.env.API}/delete-firestore`, {})
        .then((response) => {
          console.log(response)
          this.$q.notify({
            message: 'Data deleted.',
            actions: [
              {
                label: 'Dismiss',
                color: 'primary',
              },
            ],
          })
        })
        .catch((err) => {
          console.log('error ', err)
          this.$q.dialog({
            title: 'Error',
            message: 'Delete failed.',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
    // load
    getPosts() {
      this.loadingPosts = true
      // load posts from Heroku server via axios & express
      this.$axios
        .get(`${process.env.API}/posts`)
        .then((response) => {
          this.posts = response.data
          /// console.log(this.posts.length, this.posts)
          if (this.posts.length > 0) {
            this.uploaded = 'rounded row'
          }
        })
        .catch((err) => {
          this.$q.dialog({
            title: 'Error',
            message: 'Data Not Loaded.',
          })
          console.log('error: ', err)
        })
        .finally(() => {
          this.loadingPosts = false
        })
    },
    // upload
    pawst() {
      console.log('Im suspended')

      // this.$q.loading.show({
      //   message: 'Posting...',
      // })

      // // get location
      // if (this.locationSupported()) {
      //   this.getLocation()
      //   console.log('location set', this.post.location)
      // } else {
      //   post.location = 'unknown'
      // }

      // let formData = new FormData()
      // formData.append('id', this.post.id)
      // formData.append('caption', this.post.caption)
      // formData.append('date', this.post.date)
      // formData.append('file', this.post.file, this.post.id + '.pdf')
      // this.$axios
      //   .post(`${process.env.API}/post-create`, formData)
      //   .then((response) => {
      //     //console.log(response)
      //     // send to the Home page after a successful post
      //     this.$router.push('/upload')
      //     // notify about posting
      //     this.$q.notify({
      //       message: 'File Uploaded.',
      //       actions: [
      //         {
      //           label: 'Dismiss',
      //           color: 'primary',
      //         },
      //       ],
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('error ', err)
      //     this.$q.dialog({
      //       title: 'Error',
      //       message: 'Upload failed.',
      //     })
      //   })
      //   .finally(() => {
      //     this.post.file = []
      //     this.fileUpload = []
      //     this.post.caption = ''
      //     this.buttonColor = 'secondary'
      //     this.$q.loading.hide()
      //   })
    },
    uploadFile(e) {
      this.post.file = e.target.files[0]
      this.post.caption = this.post.file.name.replace('.pdf', '')
      this.buttonColor = 'positive'
      console.log(this.post.file)
    },
  },
  computed: {
    pawstButtonColor() {
      return !this.post.caption.length || !this.post.file ? 'grey-5' : 'secondary'
    },
  },
  created() {
    this.getPosts()
  },
})
</script>
<style lang="sass">
.camera-frame
  border: 2px solid $grey-10
  border-radius: 10px
</style>
