<template>
  <div class="text-h4 q-mb-md q-pa-md">No Files Yet.</div>
  <q-item>
    <q-item-section avatar>
      <q-skeleton type="QAvatar" />
    </q-item-section>

    <q-item-section>
      <q-item-label>
        <q-skeleton type="text" />
      </q-item-label>
      <q-item-label caption>
        <q-skeleton type="text" width="65%" />
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'SkeletonPost',
  props: {
    post: Object,
    name: String,
  },
  created() {},
  data() {
    return {}
  },
})
</script>
