import React, { Component, Fragment } from "react";
import IntlMessages from "Util/IntlMessages";
import {
  Row,
  Card,
  CardBody,
  Nav,
  NavItem,
  Button,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
  TabContent,
  TabPane,
  Badge,
  ButtonDropdown,
  Input,
  Label,
  CustomInput,
  CardTitle,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { Colxx } from "Components/CustomBootstrap";
import { BreadcrumbItems } from "Components/BreadcrumbContainer";
import { NavLink } from "react-router-dom";
import classnames from "classnames";
import SurveyItem from "./SurveyItem";
import moment from "moment";
import ApplicationMenu from "Components/ApplicationMenu";
import PerfectScrollbar from "react-perfect-scrollbar";
import DatePicker from "react-datepicker";
import { withRouter } from 'react-router-dom'

import { connect } from "react-redux";
import {
    getSurveyDetail,
    deleteSurveyQuestion,
    saveSurvey,
    getPatientsList,
    getDischargedPatientsList
} from "Redux/actions";

import "react-datepicker/dist/react-datepicker.css";
import { database } from '../../firebase'

import { saveAs } from 'file-saver';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const surveyData = [];


class PatientsDetail extends Component {
  constructor(props) {
    super(props);


    this.patientId = this.props.match.params.patientId;
    this.date = this.props.match.params.date;
    this.status = this.props.match.params.status;

    this.toggleTab = this.toggleTab.bind(this);
    this.toggleSplit = this.toggleSplit.bind(this);
    this.handleSurveyAssessmentClick = this.handleSurveyAssessmentClick.bind(this);
    this.handleSaveSurvey = this.handleSaveSurvey.bind(this);
    this.handleSavePlannerItem = this.handleSavePlannerItem.bind(this);
    this.handlePlannerSumbit = this.handlePlannerSubmit.bind(this);

    this.toggleDeleteModal = this.toggleDeleteModal.bind(this);
    this.toggleCompleteModal = this.toggleCompleteModal.bind(this);
    this.toggleInCompleteModal = this.toggleInCompleteModal.bind(this);

    this.state = {
      activeTab: "1",
      dropdownSplitOpen: false,
      surveyData: surveyData,
      embeddedDate: moment(this.date, "YYYY-MM-DD"),
      defaultSurvey: {
        1: '',
        2: '',
        3: '',
        4: '',
        5: '',
        6: '',
        7: '',
        8: '',
        9: '',
        10: '',
        "S": ''
      },
      survey: {
        1: '',
        2: '',
        3: '',
        4: '',
        5: '',
        6: '',
        7: '',
        8: '',
        9: '',
        10: '',
        "S": ''
      },
      surveyNote: '',
      surveyWarningMessage: '',
      plannerWarningMessage: '',
      deleteModalOpen: false,
      completeModalOpen: false,
      inCompleteModalOpen: false,
      modalIndex: 0,

      defaultPlannerItem: {
        createdDate: new Date().toLocaleString('en-UK'),
        updatedDate: new Date().toLocaleString('en-UK'),
        raisedBy: localStorage.getItem('user_email'),
        completedBy: '',
        issue: '',
        action: '',
        note: '',
        complete: false,
        warning: ''
      },
      defaultPlannerItems: [
        {
          createdDate: new Date().toLocaleString('en-UK'),
          updatedDate: new Date().toLocaleString('en-UK'),
          raisedBy: localStorage.getItem('user_email'),
          completedBy: '',
          issue: '',
          action: '',
          note: '',
          complete: false,
          warning: ''
        }
      ],
      plannerItems: [
        {
          createdDate: '',
          updatedDate: '',
          raisedBy: localStorage.getItem('user_email'),
          completedBy: '',
          issue: '',
          action: '',
          note: '',
          complete: false,
          warning: ''
        }
      ],
      displayPlannerItems: [
        {
          createdDate: '',
          updatedDate: '',
          raisedBy: localStorage.getItem('user_email'),
          completedBy: '',
          issue: '',
          action: '',
          note: '',
          complete: false,
          warning: ''
        }
      ]
    };
  }

  //Comparer Function    
  GetSortOrder(prop) {    
    return function(a, b) {    
        if (a[prop] < b[prop]) {    
            return 1;    
        } else if (a[prop] > b[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
  }   

  componentDidMount() {
    this.props.getSurveyDetail();
    if (this.status === "Active") {
      this.props.getPatientsList();
    } else if (this.status === "Discharged") {
      this.props.getDischargedPatientsList();
    }
  }

  componentDidUpdate() {
    this.date = this.props.match.params.date;

    // update survey
    const patientSurvey = this.getSurvey();
    if (!this.patientSurveyUpdated) {
      this.setState({
        surveyWarningMessage: "",
        embeddedDate: moment(this.date, "YYYY-MM-DD"),
        survey: patientSurvey ? patientSurvey.answers : this.state.defaultSurvey,
        surveyNote: patientSurvey ? patientSurvey.note : ''
      });
      this.patientSurveyUpdated = true
    }

    // update planner
    const patientPlanner = this.getPlanner();
    if (!this.patientPlannerUpdated) {
      // sort plannerItems by updatedDate 
      let plannerItems;
      let displayPlannerItems;
      if (patientPlanner) {
        // if there is planner data in the database
        plannerItems = patientPlanner.data;
        displayPlannerItems = patientPlanner.data;
        plannerItems = plannerItems.sort(this.GetSortOrder('updatedDate'))
        displayPlannerItems = displayPlannerItems.sort(this.GetSortOrder('updatedDate'))
      } else if (this.status !== 'Active') {
        // if the patient is not active and no planner data in the database
        plannerItems = null;
        displayPlannerItems = null;
      } else {
        // if no data in the database but not inactive patient
        plannerItems = this.state.defaultPlannerItems;
        displayPlannerItems = this.state.defaultPlannerItems;
      }

      // set the displayed and true planner items
      this.setState({
        plannerWarningMessage: "",
        embeddedDate: moment(this.date, "YYYY-MM-DD"),
        plannerItems: plannerItems,
        displayPlannerItems: displayPlannerItems
      });

      // mark the update is done
      this.patientPlannerUpdated = true
    }
  }

  toggleDeleteModal(index) {
    this.setState({
      deleteModalOpen: !this.state.deleteModalOpen,
      modalIndex: index
    });
  }

  toggleCompleteModal(index) {
    this.setState({
      completeModalOpen: !this.state.completeModalOpen,
      modalIndex: index
    });
  }

  toggleInCompleteModal(index) {
    this.setState({
      inCompleteModalOpen: !this.state.inCompleteModalOpen,
      modalIndex: index
    });
  }

  getPatient() {
    if (this.props.patientsApp.allPatientsItems) {
      return this.props.patientsApp.allPatientsItems.find(x => x.id === this.patientId)
    }
    return null
  }

  getSurvey() {
    const patient = this.getPatient();
    //console.log(patient)
    if (patient) {
      const date = this.getDate();
      //console.log(date)
      if (date) {
        return patient.surveys && patient.surveys[date] ? patient.surveys[date] : null
      }
    }
    return null
  }

  getDate() {
    return this.date
  }

  getSum(assessmentLevel) {
    let result = 0;
    for(let k in this.state.survey) {
      if (k === "S")
        continue;
      let val = this.state.survey[k];
      if (val === assessmentLevel)
        result++
    }
    return result;
  }

  handleSaveSurvey() {
    if (this.patientId) {
      const surveyId = this.getDate();
      const surveyPath = `wards/${localStorage.getItem('user_currentWard')}/patients/${this.patientId}/surveys/${surveyId}`;

      if (!this.state.survey.S) {
        this.setState({
          surveyWarningMessage: `Please decide for "Overall Tract Assessment"!`,
        });
        return;
      } else {
        this.setState({
          surveyWarningMessage: ``,
        });
        return database.ref(surveyPath).set({
          answers: this.state.survey,
          na: this.getSum("na"),
          verylow: this.getSum("verylow"),
          low: this.getSum("low"),
          medium: this.getSum("medium"),
          high: this.getSum("high"),
          veryhigh: this.getSum("veryhigh"),
          note: this.state.surveyNote
        }).then(response => {
          this.props.getPatientsList();
        }).catch(error => error);
      }
    }
  }

  handleDeleteSurvey() {
    if (this.patientId) {
      const surveyId = this.getDate();
      const surveyPath = `wards/${localStorage.getItem('user_currentWard')}/patients/${this.patientId}/surveys/${surveyId}`;

      return database.ref(surveyPath).remove()
        .then(response => {
        this.props.getPatientsList();
        this.patientSurveyUpdated = false;
      }).catch(error => error);
    }
  }

  handleSurveyAssessmentClick(e) {
    e.preventDefault();

    // if active patient, then allow changes
    if (this.status === 'Active') {
      const id = e.target.getAttribute('data-id');
      // if click on overall assessment but other factors have not been selected first
      if ((id === 'S') && 
          (!this.state.survey['1'] ||
          !this.state.survey['2'] ||
          !this.state.survey['3'] ||
          !this.state.survey['4'] ||
          !this.state.survey['5'] ||
          !this.state.survey['6'] ||
          !this.state.survey['7'] ||
          !this.state.survey['8'] ||
          !this.state.survey['9'] ||
          !this.state.survey['10'])) 
        {
          this.setState({
            surveyWarningMessage: 'Please score all TRACT factors first before deciding for overall assessment!'
          })
      } else {
        let className = null;
        if (e.target.classList.contains("na")) {
          className = "na"
        }
        if (e.target.classList.contains("verylow")) {
          className = "verylow"
        }
        if (e.target.classList.contains("low")) {
          className = "low"
        }
        if (e.target.classList.contains("medium")) {
          className = "medium"
        }
        if (e.target.classList.contains("high")) {
          className = "high"
        }
        if (e.target.classList.contains("veryhigh")) {
          className = "veryhigh"
        }
    
        this.setState((prevState) => ({
          ...prevState,
          survey: {
            ...prevState.survey,
            [id]: prevState.survey[id] !== className ? className: null
          },
          surveyWarningMessage: `You have unsaved changes!`
        }))
      }      
    } else {
      // do nothing because discharged patient
    }
  }

  // function that handles change of the survey note
  handleSurveyNoteChange(event) {
    // get survey note from the event
    let surveyNote = event.target.value;
    // update state for current surveyNote and warning message
    this.setState((prevState) => ({ 
      ...prevState,
      surveyNote: surveyNote,
      surveyWarningMessage: `You have unsaved changes!`
    }))
  }

  toggleTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
      this.patientSurveyUpdated = true;
      this.patientPlannerUpdated = true;
    }
  }

  toggleSplit() {
    this.setState(prevState => ({
      dropdownSplitOpen: !prevState.dropdownSplitOpen
    }));
  } 

  // new planner without calendar
  getPlanner() {
    const patient = this.getPatient();
    if (patient) {
      // no datepicker for planner
      return patient.planner ? patient.planner : null
    }
    return null
  }

  handleSavePlannerItem(index) {
    // check if we have a patient
    if (this.patientId) {
      // path for firebase
      const plannerPath = `wards/${localStorage.getItem('user_currentWard')}/patients/${this.patientId}/planner`;

      // check if that is an empty itemplanner
      let isPlannerEmpty = true;
      if (this.state.displayPlannerItems[index]) {
        if (this.state.displayPlannerItems[index].issue || this.state.displayPlannerItems[index].action || this.state.displayPlannerItems[index].note) {
          isPlannerEmpty = false;
        }
      }

      // if planner item is empty say that cannot save an empty planner item
      if (isPlannerEmpty) {
        let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems));
        displayPlannerItems[index].warning = `Cannot save an empty planner!`
        this.setState({ 
          displayPlannerItems
        });
        return;
      } else {

        // update the displayed and overall planner items with the new info from display planner items
        let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems));
        let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems));
        displayPlannerItems[index].warning = '';
        displayPlannerItems[index].updatedDate = new Date().toLocaleString('en-UK');
        plannerItems[index] = displayPlannerItems[index]
        
        this.setState({
          plannerItems,
          displayPlannerItems
        });

        // save updated planner into database
        return database.ref(plannerPath).set({
          data: plannerItems
        }).then(response => {
          this.props.getPatientsList();
          // update planner through boolean
          //this.patientPlannerUpdated = false;
        }).catch(error => error);
      }
    }
  }
  
  handlePlannerChange(i, type, event) {
    // perform changes in displayPlannerItems
    let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems))
    if (type === 'issue') {
      displayPlannerItems[i].issue = event.target.value;
    } else if (type === 'action') {
      displayPlannerItems[i].action = event.target.value;
    } else if (type === 'note') {
      displayPlannerItems[i].note = event.target.value;
    }
    // update warning message for current displayed item
    displayPlannerItems[i].warning = `You have unsaved changes!`
    // update state for current displayed items
    this.setState({ 
      displayPlannerItems,
    }); 
  }

  handlePlannerItemComplete(i, type, event) {
    // check if there are unsaved changes in the current task
    if (this.state.displayPlannerItems[i].warning.length > 0) {
      // found unsaved changes, change the warning message for this task
      let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems));
      displayPlannerItems[i].warning = `You have unsaved changes! Please save first before marking task as complete!`
      this.setState({ 
        displayPlannerItems
      });
    } else {
      // no warning so change the complete state in both displayPlannerItems with correct index
      let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems));
      displayPlannerItems[i].complete = !displayPlannerItems[i].complete;
      // update the time and date
      displayPlannerItems[i].updatedDate = new Date().toLocaleString('en-UK');
      // update the complete by:
      displayPlannerItems[i].completedBy = localStorage.getItem('user_email');
      // adjust plannerItems accordingly
      let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems));
      plannerItems[i] = displayPlannerItems[i];

      // update planners and then save the planner item by index
      this.setState({ 
        plannerItems,
        displayPlannerItems,
      }, () => {
        this.handleSavePlannerItem(i);
        // update planner through boolean
        //this.patientPlannerUpdated = false;
      }); 
    }
    // close correct modal depending on completing or uncompleting task
    if (type === 'complete') {
      this.toggleCompleteModal();
    } else if (type === 'incomplete') {
      this.toggleInCompleteModal();
    }
  }

  addPlannerItemClick() {
    // add a planner item just into display planner items
    this.setState(prevState => ({
      displayPlannerItems: [...prevState.displayPlannerItems, this.state.defaultPlannerItem]
    }))
  }

  removePlannerItemClick(i)  {
    // cut both display and plannerItems by index
    let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
    let displayPlannerItems = JSON.parse(JSON.stringify(this.state.displayPlannerItems))
    plannerItems.splice(i, 1);
    displayPlannerItems.splice(i, 1);
    // set the state for both display and planner items and then save
    this.setState({ 
      plannerItems,
      displayPlannerItems
    });

    // path for firebase
    const plannerPath = `wards/${localStorage.getItem('user_currentWard')}/patients/${this.patientId}/planner`;
    // save planner into database
    return database.ref(plannerPath).set({
      data: plannerItems
    }).then(response => {
      this.props.getPatientsList();
      // close the modal
      this.toggleDeleteModal();
    }).catch(error => error);

  }

  handlePlannerSubmit(event) {
    alert('A planner was submitted: ' + this.state.plannerItems.join(', '));
    event.preventDefault();
  }

  exportPlanner() {

    const patient = this.getPatient();

    // get list of tasks as a deep copy
    let savedItems = JSON.parse(JSON.stringify(this.state.plannerItems))

    savedItems = savedItems.sort((a, b) => {     
      return moment(a.createdDate, "DD/MM/YYYY, hh:mm:ss").diff(moment(b.createdDate, "DD/MM/YYYY, hh:mm:ss"));
    });
    
    // saving to pdf
    const doc = new jsPDF({orientation: "portrait"});
    doc.setFontSize(15)
    let lineCoordinate = 10;
    doc.text(`Patient name: ${patient.name}`, 5, lineCoordinate);
    lineCoordinate += 10;
    doc.text(`Patient ID: ${patient.id}`, 5, lineCoordinate);
    lineCoordinate += 10;
    doc.text(`Date admitted: ${patient.createDate}`, 5, lineCoordinate);
    lineCoordinate += 10;
    

    for (let i = 0; i < savedItems.length; i++) {
      let item = savedItems[i];
      let createdDate = item.createdDate.substring(0, item.createdDate.indexOf(',')) + item.createdDate.substring(item.createdDate.indexOf(',') + 1, item.createdDate.length);
      let updatedDate = item.updatedDate.substring(0, item.updatedDate.indexOf(',')) + item.updatedDate.substring(item.updatedDate.indexOf(',') + 1, item.updatedDate.length);
      let complete = item.complete ? "Complete" : "Incomplete";

      doc.setFontSize(13)
      doc.text(`Planner item ${i + 1}`, 13, lineCoordinate);
      lineCoordinate += 5;
      doc.setFontSize(15)
      doc.autoTable({
        theme: 'grid',
        startY: lineCoordinate,
        columnStyles: {
          0: { fillColor: [0, 166, 115], textColor: 255, fontStyle: 'bold', cellWidth: 35 },
        },
        body: [
          ['Care trajectory management issue', item.issue],
          ['Created', createdDate],
          ['Last updated', updatedDate],
          ['Action', item.action],
          ['Notes', item.note],
          ['Action complete?', complete]
        ]

      });
      lineCoordinate = doc.lastAutoTable.finalY + 10;
      
    }
    
    doc.save(`Planner_${patient.id}.pdf`);


    // saving to csv
    
    // let data = [
    //   ["Patient name", patient.name],
    //   ["Patient ID", patient.id],
    //   ["Date admitted", patient.createDate],
    //   [''],
    //   ["Planner item", "Created date", "Updated date", "Issue", "Action", "Notes", "Completion status"]
    // ]
    // for (let i = 0; i < this.state.plannerItems.length; i++) {
    //   let item = this.state.plannerItems[i];
    //   let createdDate = item.createdDate.substring(0, item.createdDate.indexOf(',')) + item.createdDate.substring(item.createdDate.indexOf(',') + 1, item.createdDate.length);
    //   let updatedDate = item.updatedDate.substring(0, item.updatedDate.indexOf(',')) + item.updatedDate.substring(item.updatedDate.indexOf(',') + 1, item.updatedDate.length);
    //   let complete = item.complete ? "Complete" : "Incomplete";
    //   data.push([`Planner Item ${i + 1}`, createdDate, updatedDate, item.issue, item.action, item.note, complete])
    // }
 
    // let csvContent = data.map(e => e.join(",")).join("\n");
    // let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    // saveAs(blob, `Planner_${patient.id}.csv`)

  }

  moveToPatient(patientType) {
    // make a copy of patients list
    let patientsListToSort = JSON.parse(JSON.stringify(this.props.patientsApp.allPatientsItems));
    const order = {
      field: 'name',
      asc: true,
    }

    // sort patients list based on full name
    let orderedPatientsList = patientsListToSort.sort((a, b) => {
      if (order.asc) {
        return a[order.field].toLowerCase().localeCompare(b[order.field].toLowerCase(), undefined, {
          numeric: true,
          sensitivity: 'base'
        })
      }
      else {
        return b[order.field].toLowerCase().localeCompare(a[order.field].toLowerCase(), undefined, {
          numeric: true,
          sensitivity: 'base'
        })
      }
      
    })

    // get current patients index in the sorted patients items list
    let currentPatientIndex = orderedPatientsList.findIndex(x => x.id === this.patientId);

    // check if the last patient and next patient clicked. If so - do nothing
    if ((currentPatientIndex == orderedPatientsList.length - 1) && (patientType === 'next')) {
      return null;
    }
    // check if the first patient and previous patient clicked. If so - do nothing.
    else if ((currentPatientIndex == 0) && (patientType === 'previous')) {
      return null;
    }
    // else navigate to next/previous patient
    else {
      let switchPatientId = 0;
      if (patientType === 'next') {
        switchPatientId = orderedPatientsList[currentPatientIndex + 1].id;
      }
      else {
        switchPatientId = orderedPatientsList[currentPatientIndex - 1].id;
      }
      this.patientId = switchPatientId;
      this.patientSurveyUpdated = false;
      this.patientPlannerUpdated = false;
      this.props.history.push(`/app/patients/detail/${switchPatientId}/${moment().format("YYYY-MM-DD")}/${this.status}`)
    }
  }

  createPlannerUI() {

    let warningBox;
    let warningStyle = { 
      "textAlign": "center",
      "fontWeight": "bolder"
    };
    if (this.state.plannerWarningMessage.length > 0) {
      warningBox = 
      <div className="notification-error mt-2 mb-2" style={warningStyle}>
        {this.state.plannerWarningMessage}
      </div>
    } else {
      warningBox = null;
    }

    let plannerCardClass = [];
    if (this.state.displayPlannerItems) {
      for (let i = 0; i < this.state.displayPlannerItems.length; i++) {
        if (this.state.displayPlannerItems[i].complete) {
          plannerCardClass.push("d-flex flex-grow-1 min-width-zero flex-row card-planner-complete")
        } else {
          plannerCardClass.push("d-flex flex-grow-1 min-width-zero flex-row card-planner-noncomplete")
        }
      }
    }

    let incompleteTaskList = [];
    let completeTaskList = [];
    if (this.state.displayPlannerItems) {
      for (let i = 0; i < this.state.displayPlannerItems.length; i++) {
        if (this.state.displayPlannerItems[i].complete === false) {
          incompleteTaskList.push([this.state.displayPlannerItems[i], i])
        } else {
          completeTaskList.push([this.state.displayPlannerItems[i], i])
        }
      }
    }

    let incompletePlannerItemList;
    let incompleteTaskLabel = <h3>Incomplete tasks:</h3>
    if (incompleteTaskList.length === 0 && completeTaskList.length === 0) {
      incompleteTaskLabel = <h3>No tasks recorded.</h3>
    }
    if (incompleteTaskList.length > 0) {
      incompletePlannerItemList = incompleteTaskList.map((plannerItem, i) => (
                                      <div key={i}>
                                        <Card className="question d-flex mb-3">
                                          <div className={plannerCardClass[plannerItem[1]]}>
                                            <div className="card-body card-planner align-self-center d-flex flex-column justify-content-between min-width-zero">
                                              <div className="d-flex flex-row">
                                                  <Label className="list-item-heading">
                                                    Date raised:&nbsp;&nbsp;
                                                  </Label>
                                                  <Label className="list-item-heading">
                                                    {plannerItem[0].createdDate}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                  </Label>
                                                  <Label className="list-item-heading">
                                                    Last updated:&nbsp;&nbsp;
                                                  </Label>
                                                  <Label className="list-item-heading">
                                                    {plannerItem[0].updatedDate}
                                                  </Label>
                                              </div>

                                              <div className="d-flex flex-row">
                                                <Label className="list-item-heading">
                                                  Created by:&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  {plannerItem[0].raisedBy}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </Label>
                                              </div>

                                              <Label className="list-item-heading">
                                                Care trajectory managemenent issue:
                                              </Label>
                                              <Input
                                                disabled={this.status !== 'Active'}
                                                className="h-10"
                                                type="text"
                                                value={plannerItem[0].issue}
                                                onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'issue')}
                                              />
                                              <Label className="list-item-heading mt-2">
                                                  Action:
                                              </Label>
                                              <Input
                                                disabled={this.status !== 'Active'}
                                                type="text"
                                                value={plannerItem[0].action}
                                                onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'action')}
                                              />
                                              <Label className="list-item-heading mt-2">
                                                  Notes:
                                              </Label>
                                              <Input
                                                disabled={this.status !== 'Active'}
                                                type="textarea"
                                                value={plannerItem[0].note}
                                                onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'note')}
                                              />
                                              <div className="mt-3 flex-row d-flex">
                                                <Button
                                                  hidden={this.status !== "Active"}
                                                  className="mr-3"
                                                  outline
                                                  size="sm"
                                                  color="primary"
                                                  //onClick={this.handleSavePlanner}
                                                  onClick={() => this.handleSavePlannerItem(plannerItem[1])}
                                                >
                                                  <IntlMessages id="todo.save" />
                                                </Button>
                                                <Button
                                                  hidden={this.status !== "Active"}
                                                  outline
                                                  color="primary"
                                                  size="sm"
                                                  //onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1])}
                                                  onClick={() => this.toggleCompleteModal(plannerItem[1])}
                                                >
                                                  <IntlMessages id="todo.complete" />
                                                </Button>
                                                <Modal isOpen={this.state.completeModalOpen} toggle={this.toggleCompleteModal} wrapClassName="modal-middle" backdrop="static">
                                                  <ModalHeader>
                                                    Are you sure?
                                                  </ModalHeader>
                                                  <ModalBody>
                                                    <p>Do you really want to mark this task as complete?</p>
                                                  </ModalBody>
                                                  <ModalFooter>
                                                    <Button color="primary" onClick={this.handlePlannerItemComplete.bind(this, this.state.modalIndex, 'complete')}>
                                                      <IntlMessages id="todo.confirm" />
                                                    </Button>
                                                    <Button color="primary" outline onClick={() => this.toggleCompleteModal(0)}>
                                                      <IntlMessages id="todo.cancel" />
                                                    </Button>
                                                  </ModalFooter>
                                                </Modal>
                                              </div>
                                              <div className="notification-error mt-2 mb-2" style={warningStyle} hidden={!plannerItem[0].warning}>
                                                {plannerItem[0].warning}
                                              </div>
                                              {warningBox}
                                            </div>
                                            <div className="card-top-buttons">
                                              <Button 
                                                hidden={this.status !== "Active"}
                                                close
                                                //onClick={this.removePlannerItemClick.bind(this, plannerItem[1])}
                                                onClick={() => this.toggleDeleteModal(plannerItem[1])}
                                                >
                                                <span aria-hidden="true">&times;</span>
                                              </Button>
                                              <Modal isOpen={this.state.deleteModalOpen} toggle={this.toggleDeleteModal} wrapClassName="modal-middle" backdrop="static">
                                                <ModalHeader>
                                                  Are you sure?
                                                </ModalHeader>
                                                <ModalBody>
                                                  <p>Do you really want to delete this task?</p>
                                                  <p>This action cannot be undone!</p>
                                                </ModalBody>
                                                <ModalFooter>
                                                  <Button color="primary" onClick={this.removePlannerItemClick.bind(this, this.state.modalIndex)}>
                                                    <IntlMessages id="todo.confirm" />
                                                  </Button>
                                                  <Button color="primary" outline onClick={() => this.toggleDeleteModal(0)}>
                                                    <IntlMessages id="todo.cancel" />
                                                  </Button>
                                                </ModalFooter>
                                              </Modal>
                                            </div>
                                          </div>
                                        </Card>
                                      </div>     
                                  ))
      }

    let completePlannerItemList;
    let completeTaskLabel;
    if (completeTaskList.length > 0) {
      completePlannerItemList = completeTaskList.map((plannerItem, i) => (
                                    <div key={i}>
                                      <Card className="question d-flex mb-3">
                                        <div className={plannerCardClass[plannerItem[1]]}>
                                          <div className="card-body card-planner align-self-center d-flex flex-column justify-content-between min-width-zero">
                                            <div className="d-flex flex-row">
                                                <Label className="list-item-heading">
                                                  Date raised:&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  {plannerItem[0].createdDate}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  Last updated:&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  {plannerItem[0].updatedDate}
                                                </Label>
                                            </div>

                                            <div className="d-flex flex-row">
                                                <Label className="list-item-heading">
                                                  Created by:&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  {plannerItem[0].raisedBy}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  Completed by:&nbsp;&nbsp;
                                                </Label>
                                                <Label className="list-item-heading">
                                                  {plannerItem[0].completedBy}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </Label>
                                            </div>

                                            <Label className="list-item-heading">
                                              Care trajectory managemenent issue:
                                            </Label>
                                            <Input
                                              disabled={true}
                                              className="h-10"
                                              type="text"
                                              value={plannerItem[0].issue}
                                              onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'issue')}
                                            />
                                            <Label className="list-item-heading mt-2">
                                                Action:
                                            </Label>
                                            <Input
                                              disabled={true}
                                              type="text"
                                              value={plannerItem[0].action}
                                              onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'action')}
                                            />
                                            <Label className="list-item-heading mt-2">
                                                Notes:
                                            </Label>
                                            <Input
                                              disabled={true}
                                              type="textarea"
                                              value={plannerItem[0].note}
                                              onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'note')}
                                            />
                                            <div className="d-flex flex-grow-1 min-width-zero flex-row mt-2">
                                                <Button
                                                  hidden={this.status !== "Active"}
                                                  outline
                                                  color="primary"
                                                  size="sm"
                                                  className="mt-2 mr-2"
                                                  //onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1])}
                                                  onClick={() => this.toggleInCompleteModal(plannerItem[1])}
                                                >
                                                  <IntlMessages id="todo.incomplete" />
                                                </Button>
                                                <Modal isOpen={this.state.inCompleteModalOpen} toggle={this.toggleInCompleteModal} wrapClassName="modal-middle" backdrop="static">
                                                  <ModalHeader>
                                                    Are you sure?
                                                  </ModalHeader>
                                                  <ModalBody>
                                                    <p>Do you really want to mark this task as incomplete?</p>
                                                  </ModalBody>
                                                  <ModalFooter>
                                                    <Button color="primary" onClick={this.handlePlannerItemComplete.bind(this, this.state.modalIndex, 'incomplete')}>
                                                      <IntlMessages id="todo.confirm" />
                                                    </Button>
                                                    <Button color="primary" outline onClick={() => this.toggleInCompleteModal(0)}>
                                                      <IntlMessages id="todo.cancel" />
                                                    </Button>
                                                  </ModalFooter>
                                                </Modal>
                                              </div>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>     
                                ))
      completeTaskLabel = <h3>Complete tasks:</h3>
      }

    return <div>
            {incompleteTaskLabel}
            {incompletePlannerItemList}
            <div className="mb-4">
              <Button
                hidden={this.status !== "Active"}
                className="mr-2"
                outline
                color="primary"
                onClick={this.addPlannerItemClick.bind(this)}
                >
                <IntlMessages id="todo.add-planneritem" />
              </Button>
            </div>
            {completeTaskLabel}
            {completePlannerItemList}
          </div>
 }       

  render() {
    const { survey, loading } = this.props.surveyDetailApp;

    const patient = this.getPatient();
    const patientSurvey = this.getSurvey();

    let warningBox;
    let warningStyle = { 
      "textAlign": "center",
      "fontWeight": "bolder"
    };
    if (this.state.surveyWarningMessage.length > 0) {
      warningBox = 
      <div className="notification-error mb-2" style={warningStyle}>
        {this.state.surveyWarningMessage}
      </div>
    } else {
      warningBox = null;
    }    

    const getOverAllBadge = (patientSurvey) => {
      const s = patientSurvey && patientSurvey.answers && patientSurvey.answers['S'] ? patientSurvey.answers['S'] : null;

      if (s === 'na') {
        return <Badge color="na" pill>N/A</Badge>
      }
      if (s === 'verylow') {
        return <Badge color="verylow" pill>VERY LOW</Badge>
      }
      if (s === 'low') {
        return <Badge color="low" pill>LOW</Badge>
      }
      if (s === 'medium') {
        return <Badge color="medium" pill>MEDIUM</Badge>
      }
      if (s === 'high') {
        return <Badge color='high' pill>HIGH</Badge>
      }
      if (s === 'veryhigh') {
        return <Badge color='veryhigh' pill>VERY HIGH</Badge>
      }
    };

    // get counts for tasks
    let totalTasksCount = 0;
    let incompleteTasksCount = 0;
    if (this.state.plannerItems) {
      totalTasksCount = this.state.plannerItems.length;
      for (let i = 0; i < this.state.plannerItems.length; i++) {
        if (this.state.plannerItems[i].complete === false) {
          incompleteTasksCount++;
        }
      }
    }

    let highlightAssessmentDates = [];
    if (patient && patient.surveys) {
      for (let k in patient.surveys) {
        highlightAssessmentDates.push(moment(k, "YYYY-MM-DD"))
      }
    }

    // another assessment datepicker implementation
    // const AssessmentDatePicker = <DatePicker
    //                           calendarClassName="embedded"
    //                           inline
    //                           selected={this.state.embeddedDate}
    //                           onChange={(date) => {
    //                             this.patientSurveyUpdated = false
    //                             this.props.history.push(`/app/patients/detail/${this.patientId}/${date.format("YYYY-MM-DD")}/${this.status}`)
    //                           }}
    //                           highlightDates={highlightAssessmentDates}
    //                           locale="en-GB"
    //                         >
    //                       </DatePicker>


    const AssessmentDatePicker = withRouter(({history}) => (
      <DatePicker
        calendarClassName="embedded"
        inline
        selected={this.state.embeddedDate}
        onChange={(date) => {
          this.patientSurveyUpdated = false
          history.push(`/app/patients/detail/${this.patientId}/${date.format("YYYY-MM-DD")}/${this.status}`)
        }}
        highlightDates={highlightAssessmentDates}
        locale="en-GB"
      />
    ));

    let saveAssessmentButton;
    if (this.status === 'Active') {
      saveAssessmentButton = <ButtonDropdown
                      className="top-right-button top-right-button-single"
                      isOpen={this.state.dropdownSplitOpen}
                      toggle={this.toggleSplit}
                    >
                      <Button
                        outline
                        className="flex-grow-1"
                        size="lg"
                        color="primary"
                        onClick={this.handleSaveSurvey}
                      >
                        SAVE
                      </Button>
                      <DropdownToggle
                        size="lg"
                        className="pr-4 pl-4"
                        caret
                        outline
                        color="primary"
                      />
                      <DropdownMenu persist>
                        <DropdownItem
                          onClick={() => { 
                            this.handleDeleteSurvey(); 
                          }}
                        >
                          DELETE
                        </DropdownItem>
                      </DropdownMenu>
                    </ButtonDropdown>
    } else {
      saveAssessmentButton = null;
    }

    // let title = <IntlMessages id="menu.patients" />
    // let title = `Patient assessment and planning: ${localStorage.getItem('user_currentWard')} `
    let title = `TRACT Patient Data: ${localStorage.getItem('user_currentWard')} `;

    return (
      <Fragment>
        <style>{`
          .react-datepicker__day--today {
            color: #000 !important;
          }
          .react-datepicker__day--today.react-datepicker__day--selected {
            color: #fff !important;
          }
        `}</style>
        <Row className="app-row survey-app">
          <Colxx xxs="12">
            <div>
              <h1>
                <span className="align-middle d-inline-block pt-1">{title}</span>
              </h1>
              <div className="float-sm-right mb-2">
                <Button
                  color="primary"
                  size="sm"
                  className="mr-2"
                  onClick={() => this.moveToPatient('previous')}
                >
                  <IntlMessages id="todo.previouspatient" />
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  className="mr-2"
                  onClick={() => this.moveToPatient('next')}
                >
                  <IntlMessages id="todo.nextpatient" />
                </Button>
              </div>
              {/* <BreadcrumbItems match={this.props.match} /> */}
            </div>
            
            {loading ?
            <Fragment>
            <Nav tabs className="separator-tabs ml-0 mb-5">
              <NavItem>
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "1",
                    "nav-link": true
                  })}
                  onClick={() => {
                    this.toggleTab("1");
                  }}
                  to="#"
                >
                  ASSESSMENT TOOL
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "2",
                    "nav-link": true
                  })}
                  onClick={() => {
                    this.toggleTab("2");
                  }}
                  to="#"
                >
                  TRACT PLANNER
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1">
                <Row>
                  <Colxx xxs="12" lg="4" className="mb-4">
                    <Card className="mb-4">
                      <CardBody>

                        <p className="text-muted text-small mb-2">ID</p>
                        <p className="mb-3">{patient ? patient.id : null}</p>

                        <p className="text-muted text-small mb-2">Name</p>
                        <p className="mb-3">{patient ? patient.name: null}</p>

                        <p className="text-muted text-small mb-2">Admitted Date</p>
                        <p className="mb-3">{patient ? patient.createDate: null}</p>

                      </CardBody>
                    </Card>

                    {/* Datepicker for assessment */}
                    <Card>
                      <CardBody>
                        {/* {AssessmentDatePicker} */}
                        <AssessmentDatePicker/>
                      </CardBody>
                    </Card>
                    
                    {/* Assessment summary card */}
                    {/* <Card className="mt-4">
                      <CardBody>
                        <CardTitle>Assessment summary</CardTitle>
                        <Row>
                          <Colxx><Badge color="na" pill>N/A</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.na : 0}</Colxx>
                        </Row>
                        <Row className="mt-1 mb-1">
                          <Colxx><Badge color="verylow" pill>VERY LOW</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.verylow : 0}</Colxx>
                        </Row>
                        <Row className="mt-1 mb-1">
                          <Colxx><Badge color="low" pill>LOW</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.low : 0}</Colxx>
                        </Row>
                        <Row className="mt-1 mb-1">
                          <Colxx><Badge color="medium" pill>MEDIUM</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.medium : 0}</Colxx>
                        </Row>
                        <Row className="mt-1 mb-1">
                          <Colxx><Badge color="high" pill>HIGH</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.high : 0}</Colxx>
                        </Row>
                        <Row>
                          <Colxx><Badge color="veryhigh" pill>VERY HIGH</Badge></Colxx>
                          <Colxx>{patientSurvey ? patientSurvey.veryhigh : 0}</Colxx>
                        </Row>
                        <Row className="mt-4 mb-1">
                          <Colxx><div className="badge badge-pill badge-outline-primary">OVERALL TRACT ASSESSMENT</div></Colxx>
                          <Colxx>{ getOverAllBadge(patientSurvey) }</Colxx>
                        </Row>
                      </CardBody>
                    </Card> */}

                    {/* Assessment overall score card */}
                    {/* 
                    <Card className="mt-4">
                      <CardBody>
                        <Row>
                          <Colxx><div className="badge badge-pill badge-outline-primary">Overall Tract Assessment</div></Colxx>
                          <Colxx>{ getOverAllBadge(patientSurvey) }</Colxx>
                        </Row>
                      </CardBody>
                    </Card> */}

                  </Colxx>
                  
                  <Colxx xxs="12" lg="8">
                    <div className="list-item-heading mb-3">Score each TRACT factor and make an overall assessment of trajectory complexity.</div>
                    <ul className="list-unstyled mb-4">
                        {survey && survey.survey ? survey.survey.map((item, index) => {
                          //console.log(this.state.survey)
                          return (
                            <li data-id={item.id} key={item.id}>
                              <SurveyItem
                                key={item.id}
                                id={item.id}
                                order={item.id}
                                definition={item.definition}
                                questions={item.questions}
                                title={item.factor}
                                onClick={this.handleSurveyAssessmentClick}
                                surveyItem={this.state.survey[item.id]}
                              />
                            </li>
                          );
                        }) : null}
                    </ul>
                    <div className="mb-3">
                      <Label className="list-item-heading mt-2">
                          Rationale:
                      </Label>
                      <Input
                        disabled={this.status !== 'Active'}
                        type="textarea"
                        value={this.state.surveyNote}
                        onChange={this.handleSurveyNoteChange.bind(this)}
                      />
                    </div>
                    {warningBox}
                    <div className="float-sm-right mb-4">
                      {saveAssessmentButton}
                    </div>
                  </Colxx>
                </Row>
              </TabPane>
              <TabPane tabId="2">
                <Row>
                  <Colxx xxs="12" lg="4" className="mb-4">
                    <Card className="mb-4">
                      <CardBody>

                        <p className="text-muted text-small mb-2">ID</p>
                        <p className="mb-3">{patient ? patient.id : null}</p>

                        <p className="text-muted text-small mb-2">Name</p>
                        <p className="mb-3">{patient ? patient.name: null}</p>

                        <p className="text-muted text-small mb-2">Admitted Date</p>
                        <p className="mb-3">{patient ? patient.createDate: null}</p>

                      </CardBody>
                    </Card>

                    {/* Datepicker for planner */}
                    {/* <Card>
                      <CardBody>
                        <PlannerDatePicker/>
                      </CardBody>
                    </Card> */}

                    {/* Planner summary card */}
                    <Card className="mt-4">
                      <CardBody>
                        <CardTitle>Planner summary</CardTitle>
                        <Row>
                          <Colxx><p>Total tasks</p></Colxx>
                          <Colxx>{totalTasksCount}</Colxx>
                        </Row>
                        <Row>
                          <Colxx><p>Incomplete tasks</p></Colxx>
                          <Colxx>{incompleteTasksCount}</Colxx>
                        </Row>
                      </CardBody>
                    </Card>
                    <div className="float-sm-right mt-3">
                      <Button
                        outline
                        className="mb-4"
                        color="primary"
                        onClick={() => this.exportPlanner()}
                        >
                        <IntlMessages id="todo.exportplanner" />
                      </Button>
                    </div>
                  </Colxx>

                  <Colxx xxs="12" lg="8">
                  <div className="list-item-heading mb-3">This supplementary tool can be used to support care planning; its use is optional.</div>
                    <form className="mb-4" onSubmit={this.handlePlannerSubmit}>
                      <div className="mb-2">
                        {this.createPlannerUI()}     
                      </div>
                    </form>
                  </Colxx>
                </Row>
              </TabPane>
            </TabContent>
            </Fragment>
             :<div className="loading"></div>
            }
          </Colxx>
        </Row>

        <ApplicationMenu>
          <PerfectScrollbar
            option={{ suppressScrollX: true, wheelPropagation: false }}
          >
            <div className="p-4">
              <p className="text-muted text-small">Status</p>
              <ul className="list-unstyled mb-5">
                <li>
                  <NavLink to="#">
                    <i className="simple-icon-check" />
                    Completed assessments
                    <span className="float-right">{patient && patient.surveys ? Object.keys(patient.surveys).length : 0 }</span>{" "}
                  </NavLink>
                </li>
              </ul>
            </div>
          </PerfectScrollbar>
        </ApplicationMenu>
     
    </Fragment>
    );
  }
}

const mapStateToProps = ({ patientsApp, surveyDetailApp }) => {
  return {
      patientsApp,
      surveyDetailApp
  };
};

export default connect(
  mapStateToProps,
  {
      getSurveyDetail,
      deleteSurveyQuestion,
      saveSurvey,
      getPatientsList,
      getDischargedPatientsList
  }
)(PatientsDetail);
