<template>
  <q-page class="constrain q-pa-md">
    <q-item>
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

      <div class="col-9">
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
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { uid } from 'quasar'
import { ref } from 'vue'
export default defineComponent({
  name: 'FileUpload',
  setup() {
    return {
      files: ref(null),
      buttonColor: 'secondary',
    }
  },
  data() {
    return {
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
    }
  },
  methods: {
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
          this.$router.push('/')
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
          this.$q.loading.hide()
        })
    },
    uploadFile(e) {
      this.post.file = e.target.files[0]
      this.buttonColor = 'positive'
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
    dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(',')[1])
      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length)
      // create a view into the buffer
      var ia = new Uint8Array(ab)
      // set the bytes of the buffer to the correct values
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      // write the ArrayBuffer to a blob, and you're done
      var blob = new Blob([ab], { type: mimeString })
      return blob
    },
  },
  computed: {
    pawstButtonColor() {
      return !this.post.caption.length || !this.post.file ? 'grey-5' : 'secondary'
    },
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
