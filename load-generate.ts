import axios from 'axios';

const loadTest = async () => {
  const url = "http://localhost:3000/";
  const requests = [];

  for (let i = 0; i < 10000000; i++) {
    requests.push(axios.get(url).catch(e => null));
  }

  await Promise.all(requests);
  console.log("Load sent!");
};

loadTest();
