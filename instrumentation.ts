export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeNextHoloProject } = await import('@holo-js/adapter-next')
    await initializeNextHoloProject()
  }
}
