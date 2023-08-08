export async function delay(time: number) {
    // console.log('delay');
    
    return new Promise((resolve) => setTimeout(resolve, time));
}
