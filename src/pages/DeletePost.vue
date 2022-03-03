<template>
  <q-page class="constrain q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-8">
        <div class="camera-frame q-pa-md">
          <video
            v-show="!imageCaptured"
            ref="userVideo"
            class="full-width"
            autoplay
            playsinline
          />
          <canvas
            v-show="imageCaptured"
            ref="userImage"
            class="full-width"
            height="240"
          />
        </div>
        <div class="text-center q-pa-md">
          <q-btn
            v-if="hasCameraSupport"
            @click="captureImage"
            :disable="imageCaptured"
            round
            color="grey-10"
            size="lg"
            icon="camera"
          />
          <q-file
            v-else
            standout
            rounded
            bg-color="secondary"
            label="Pick an Image"
            class="text-center q-pa-md"
            style="max-width: 200px; margin-left: auto; margin-right: auto"
            accept="image/*"
            v-model="imageUpload"
            @input="captureImageFile"
          >
            <template v-slot:append>
              <q-icon name="attach_file" @click.stop />
            </template>
          </q-file>

          <div class="row justify-center q-ma-md">
            <q-input
              v-model="post.caption"
              class="col col-sm-8"
              label="Caption *"
              dense
            />
          </div>
          <div class="row justify-center q-ma-md">
            <q-input
              v-model="post.location"
              :loading="loadingLocation"
              class="col col-sm-8"
              label="Location"
              dense
            >
              <template v-slot:append>
                <q-btn
                  v-if="!loadingLocation && locationSupported"
                  @click="getLocation"
                  dense
                  flat
                  icon="gps_fixed"
                />
              </template>
            </q-input>
          </div>
          <div class="row justify-center q-mt-lg">
            <q-btn
              unelevated
              rounded
              @click="pawst"
              :disable="!post.caption.length || !post.photo"
              color="secondary"
              label="PAWST IMAGE"
              icon="pets"
            />
          </div>
        </div>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img src="~assets/MaineCoon.png" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-bold">Floofster</q-item-label>
            <q-item-label caption>@Kittybox</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { uid } from 'quasar'
export default defineComponent({
  name: 'CameraPage',
  data() {
    return {
      post: {
        id: uid(),
        caption: '',
        location: '',
        date: Date.now(),
        photo: null,
      },
      imageCaptured: false,
      imageUpload: [],
      hasCameraSupport: true,
      apiOsMap: 'https://nominatim.openstreetmap.org/',
      loadingLocation: false,
    }
  },
  computed: {
    locationSupported() {
      if ('geolocation' in navigator) return true
      return false
    },
  },
  methods: {
    pawst() {
      this.$q.loading.show({
        message: 'Posting...',
      })

      let formData = new FormData()
      formData.append('id', this.post.id)
      formData.append('caption', this.post.caption)
      formData.append('date', this.post.date)
      formData.append('location', this.post.location)
      formData.append('file', this.post.photo, this.post.id + '.png')

      this.$axios
        .post(`${process.env.API}/posts-create`, formData)
        .then((response) => {
          console.log(response)
          // send to the Home page after a successful post
          this.$router.push('/')
          // notify about posting
          this.$q.notify({
            message: 'Post created.',
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
            message: 'Posting failed.',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
    initCamera() {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then((stream) => {
          this.$refs.userVideo.srcObject = stream
        })
        .catch((error) => {
          this.hasCameraSupport = false
        })
    },
    captureImage() {
      if (!this.imageCaptured) {
        // capture image
        let video = this.$refs.userVideo
        let image = this.$refs.userImage

        image.width = video.getBoundingClientRect().width
        image.height = video.getBoundingClientRect().height

        let context = image.getContext('2d')
        console.log(context)

        context.drawImage(video, 0, 0, image.width, image.height)
        this.imageCaptured = true

        this.post.photo = this.dataURItoBlob(image.toDataURL())
        this.disableCamera()
      } else {
        // reset recorder
        this.imageCaptured = false
      }
    },
    captureImageFile(e) {
      this.post.photo = e.target.files[0]
      console.log(this.post.photo)
      // show picture on html5 canvas
      let canvas = this.$refs.userImage
      let context = canvas.getContext('2d')

      var reader = new FileReader()
      reader.onload = (event) => {
        var img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          context.drawImage(img, 0, 0)
          this.imageCaptured = true
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(this.post.photo)
    },
    disableCamera() {
      this.$refs.userVideo.srcObject.getVideoTracks().forEach((track) => {
        track.stop()
      })
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
          //console.log(result.data.features[0])
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
  mounted() {
    this.initCamera()
  },
  beforeDestroy() {
    if (this.hasCameraSupport) {
      this.disableCamera()
    }
  },
})
</script>
<style lang="sass">
.camera-frame
  border: 2px solid $grey-10
  border-radius: 10px
</style>
