<head>
    <link rel="stylesheet" href="/src/styles/modal.css">
</head>

<script>
    import postTag from './newPost.svelte';
    export let show = false;
    /**
	 * @type {any}
	 */
     export let close;
</script>

{#if show}
<div class="modal-background" on:click={close}>
    <div class="modal-content" on:click={e => e.stopPropagation()}>
        <slot></slot>
    </div>
</div>
{/if}

