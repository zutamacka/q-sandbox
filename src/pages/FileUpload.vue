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
    <q-item> <q-pdfviewer type="pdfjs" :src="pdfLink" /></q-item>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { uid } from 'quasar'
import { ref } from 'vue'
import { date } from 'quasar'
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
    // view
    pdfLinkUp() {
      this.pdfLink =
        'https://mozilla.github.io/pdf.js/web/viewer.html?file=https://cors-anywhere.herokuapp.com/corsdemo/' +
        'https://www.orimi.com/pdf-test.pdf'
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
      this.$q.loading.show({
        message: 'Posting...',
      })

      // get location
      if (this.locationSupported()) {
        this.getLocation()
        console.log('location set', this.post.location)
      } else {
        post.location = 'unknown'
      }

      let formData = new FormData()
      formData.append('id', this.post.id)
      formData.append('caption', this.post.caption)
      formData.append('date', this.post.date)
      formData.append('location', this.post.location)
      formData.append('file', this.post.file, this.post.id + '.pdf')
      this.$axios
        .post(`${process.env.API}/posts-create`, formData)
        .then((response) => {
          //console.log(response)
          // send to the Home page after a successful post
          this.$router.push('/upload')
          // notify about posting
          this.$q.notify({
            message: 'File Uploaded.',
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
            message: 'Upload failed.',
          })
        })
        .finally(() => {
          this.post.file = []
          this.fileUpload = []
          this.post.caption = ''
          this.buttonColor = 'secondary'
          this.$q.loading.hide()
        })
    },
    uploadFile(e) {
      this.post.file = e.target.files[0]
      this.post.caption = this.post.file.name.replace('.pdf', '')
      this.buttonColor = 'positive'
      console.log(this.post.file)
    },
    // resolve location methods
    locationSupported() {
      if ('geolocation' in navigator) return true
      return false
    },
    // gets the location @click
    getLocation() {
      this.loadingLocation = true
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.getCityAndCountry(position)
          //
        },
        (err) => {
          console.log('error')
        },
        { timeout: 7000 }
      )
    },
    // gets the location from opencitymap by lat and lon
    getCityAndCountry(pos) {
      let apiUrl = `${this.apiOsMap}reverse?format=geojson&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      this.$axios.get(apiUrl).then(
        (result) => {
          if (result.data.features[0].properties.name) {
            this.post.location = result.data.features[0].properties.name
            if (result.data.features[0].properties.address.country_code) {
              this.post.location = `${this.post.location}, ${result.data.features[0].properties.address.country_code} `
            }
            this.loadingLocation = false
          } else {
            this.locationError()
          }
        },
        (err) => {
          this.locationError()
        }
      )
    },
    locationError() {
      this.loadingLocation = false
      this.$q.dialog({
        title: 'Error',
        message: 'Location Unknown',
      })
    },
  },
  computed: {
    pawstButtonColor() {
      return !this.post.caption.length || !this.post.file ? 'grey-5' : 'secondary'
    },
  },
  created() {
    this.getPosts()
    this.pdfLinkUp()
  },
  mounted() {},
  beforeDestroy() {},
})
</script>
<style lang="sass">
.camera-frame
  border: 2px solid $grey-10
  border-radius: 10px
</style>
