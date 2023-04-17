import axios from 'axios'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import requestIp from 'request-ip'

export default function Home({ip}) {
  const [ipArray, setIpArray] = useState([''])
  const [reqData, setReqData] = useState({})
  const [webrtcCheck, setWebrtcCheck] = useState(false)

  useEffect(() => {
    let ips = []
    async function find_public_IP() {
      //RTCPeerConnection will establish a connection between local and remote host and then returns the connection variable
      var my_RTC_Peer_Connection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      var peer_connection = new my_RTC_Peer_Connection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]}), //configurations of peer_connection
        noop = function() {},
        local_IP_arr = {},
        ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

      function find_ip_locally(ip) {
        if (!local_IP_arr[ip]) {
          setIpArray(ipArray => [...ipArray, ip])
          ips.push(ip)
        }
        local_IP_arr[ip] = true;
      }

      peer_connection.createDataChannel(""); //create a channel of communication between local and remote host for data transfer

      peer_connection.createOffer(function(sdp) {
        sdp.sdp.split('\n').forEach(function(line) {
          if (line.indexOf('candidate') < 0) return;
          line.match(ip_regex).forEach(find_ip_locally);
        });
        peer_connection.setLocalDescription(sdp, noop, noop);
      }, noop);

      peer_connection.onicecandidate = function(ice) { //event handler
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ip_regex)) return;
        ice.candidate.candidate.match(ip_regex).forEach(find_ip_locally);
      };
    }

    async function requestIpData() {
      const data = await axios.get(`https://api.incolumitas.com/?q=${ip}`)
      setReqData(data.data)
    }

    find_public_IP()
    requestIpData()
  }, [])

  useEffect(() => {
    ipArray.map((value) => {
      console.log(value, " ", ip);
      if (value.trim() == ip.trim()) {
        setWebrtcCheck(true)
      }
      else {
        setWebrtcCheck(false)
      }
    })
  }, [ipArray])
  


  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        {ip}
        <br />
        WebRTC test: {webrtcCheck ? 'true' : 'false'}
        <br/>
        {ipArray.map((ip, index) => {
          return (
            <div key={index}>
              {`${index} - ${ip}`}
            </div>
          )
        })}
        <br/>
        Datacenter ip: {reqData?.is_datacenter ? 'true' : 'false'}
      </div>
    </>
  )
}


export async function getServerSideProps({req, res}){
  
  const ip = requestIp.getClientIp(req)
  
  return {
    props:{
      ip
    }
  }
}