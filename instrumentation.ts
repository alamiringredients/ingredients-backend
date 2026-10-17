export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeNextHoloProject } = await import('@holo-js/adapter-next')
    await initializeNextHoloProject().catch((err: unknown) => {
      console.error('=== HOLO INIT FATAL ERROR ===')
      console.error(err)
      console.error('=== END HOLO INIT FATAL ERROR ===')
      throw err
    })
  }
}
