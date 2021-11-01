/* eslint-disable no-restricted-globals */
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
import { Typography, Box, Grid, Button } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";

function App() {
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState({});

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

  async function handleChange(status) {
    const arr = Object.keys(selected).filter((k) => selected[k]);
    const userDocs = await getDocs(collection(db, "users"));
    let insert = {};
    if (status === "accepted") {
      insert = { accepted: true };
    } else {
      insert = { rejected: true };
    }
    if (userDocs) {
      userDocs.docs.forEach(async (user) => {
        if (arr.includes(user.data().email)) {
          await setDoc(doc(db, "users", user.id), insert, {
            merge: true,
          });
        }
      });
    }
    setApplicants(
      applicants.filter((obj) => {
        return !arr.includes(obj.email);
      })
    );
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
            user.data().id = user.data().email;
            setApplicants((applicants) => [...applicants, user.data()]);
          }
        });
      }
    }
    getApplicants();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Box p={1} pt={4}>
            <Typography variant="h3">ATS - Undecided Applicants</Typography>
          </Box>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>First name</TableCell>
              <TableCell>Last name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>First hackathon?</TableCell>
              <TableCell>Prior experience?</TableCell>
              <TableCell>Why this hackathon?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow
                key={applicant.email}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    id={applicant.email}
                    color="primary"
                    onChange={(e) => {
                      setSelected({
                        ...selected,
                        [e.target.id]: !selected[e.target.id],
                      });
                    }}
                  />
                </TableCell>
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
      <Grid container direction="column" alignItems="center">
        <Box pt={2}>
          <Typography variant="h4">WARNING: These actions cannot be undone!</Typography>
        </Box>
        <Grid item xs={6}>
          <Box pt={2}>
            <Button
              onClick={() => {
                handleChange("accepted");
              }}
            >
              Accept selected
            </Button>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box pt={2}>
            <Button
              onClick={() => {
                handleChange("rejected");
              }}
            >
              Reject selected
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default App;
