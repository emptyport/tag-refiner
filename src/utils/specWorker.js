export default () => {
  self.addEventListener('message', e => {
      if (!e) return;
      let { file, options, index, spectralProcessor } = e.data;
      spectralProcessor = JSON.parse(spectralProcessor);
      console.log('processing '+file.file);

      let specGen = spectralProcessor(file.file, options, index);
      let result = specGen.next();
      while(!result.done) {
        console.log(result.value.progress);
        postMessage({
          index: index,
          progress: progress,
          status: 'Processing'
        });
        result = specGen.next();
      }
      
      postMessage({
        index: index,
        progress: 100,
        status: 'Done!'
      });
  })
}