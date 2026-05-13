<script lang="tsx">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    label: { type: String, required: true },
  },
  setup(props) {
    return () => <span class="renderer-label">{props.label}</span>
  },
})
</script>
