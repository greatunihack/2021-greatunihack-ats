/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  setDoc,
} from "@firebase/firestore";
import { initializeApp } from "firebase/app";
import { getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Typography, Box, Grid } from "@mui/material";

function App() {
  const [applicants, setApplicants] = useState([]);

  const firebaseApp = initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  });

  const appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(
      process.env.REACT_APP_FIREBASE_APP_CHECK_PUBLIC_KEY
    ),
    isTokenAutoRefreshEnabled: true,
  });

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);

  async function handleChange(event, status) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      console.log(text);
      const arr = text.split("\n");
      const userDocs = await getDocs(collection(db, "users"));
      let insert = {};
      console.log(arr);
      if (status === "accepted") {
        insert = { accepted: true };
      } else {
        insert = { rejected: true };
      }
      console.log(insert);
      if (userDocs) {
        userDocs.docs.forEach(async (user) => {
          if (arr.includes(user.data().email)) {
            await setDoc(doc(db, "users", user.id), insert, {
              merge: true,
            });
          }
        });
      }
    };
    reader.readAsText(event.target.files[0]);
  }

  useEffect(() => {
    async function getApplicants() {
      await signInWithEmailAndPassword(
        auth,
        process.env.REACT_APP_EMAIL,
        process.env.REACT_APP_PWD
      );
      const userDocs = await getDocs(collection(db, "users")).catch((e) => {
        alert(e);
      });
      if (userDocs) {
        userDocs.docs.forEach(async (user) => {
          if (!user.data().accepted && !user.data().rejected) {
            setApplicants([...applicants, user.data()]);
          }
        });
      }
    }
    getApplicants();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={6}>
          <Box p={1}>
            <Typography variant="h3">Accept</Typography>
          </Box>
          <Box p={1}>
            <input
              type="file"
              name="file"
              onChange={(e) => {
                handleChange(e, "accepted");
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box p={1}>
            <Typography variant="h3">Reject</Typography>
          </Box>
          <Box p={1}>
            <input
              type="file"
              name="file"
              onChange={(e) => {
                handleChange(e, "rejected");
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box p={1} pt={4}>
            <Typography variant="h3">Undecided Applicants</Typography>
          </Box>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>First Hackathon</TableCell>
              <TableCell>Prior XP</TableCell>
              <TableCell>Why This Hack</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow
                key={applicant.email}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>{applicant.firstName}</TableCell>
                <TableCell>{applicant.lastName}</TableCell>
                <TableCell>{applicant.email}</TableCell>
                <TableCell>{applicant.firstHack}</TableCell>
                <TableCell>{applicant.priorExperience}</TableCell>
                <TableCell>{applicant.whyThisHackathon}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default App;
