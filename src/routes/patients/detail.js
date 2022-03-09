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
    this.handleSavePlanner = this.handleSavePlanner.bind(this);
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
        1: 'na',
        2: 'na',
        3: 'na',
        4: 'na',
        5: 'na',
        6: 'na',
        7: 'na',
        8: 'na',
        9: 'na',
        10: 'na',
        "S": 'na'
      },
      survey: {
        1: 'na',
        2: 'na',
        3: 'na',
        4: 'na',
        5: 'na',
        6: 'na',
        7: 'na',
        8: 'na',
        9: 'na',
        10: 'na',
        "S": 'na'
      },
      warningMessage: '',
      deleteModalOpen: false,
      completeModalOpen: false,
      inCompleteModalOpen: false,

      defaultPlannerItem: {
        createdDate: new Date().toLocaleDateString('en-UK'),
        updatedDate: new Date().toLocaleDateString('en-UK'),
        issue: '',
        action: '',
        note: '',
        complete: false
      },
      defaultPlannerItems: [
        {
          createdDate: new Date().toLocaleDateString('en-UK'),
          updatedDate: new Date().toLocaleDateString('en-UK'),
          issue: '',
          action: '',
          note: '',
          complete: false
        }
      ],
      plannerItems: [
        {
          createdDate: '',
          updatedDate: '',
          issue: '',
          action: '',
          note: '',
          complete: false
        }
      ],
      displayPlannerItems: [
        {
          createdDate: '',
          updatedDate: '',
          issue: '',
          action: '',
          note: '',
          complete: false
        }
      ]
    };
  }

  componentDidMount() {
    this.props.getSurveyDetail();
    if (this.status === "Active") {
      this.props.getPatientsList();
    } else if (this.stats === "Discharged") {
      this.props.getDischargedPatientsList();
    }
  }

  componentDidUpdate() {
    console.log(this.props.match.params);
    this.date = this.props.match.params.date;
    // update survey
    const patientSurvey = this.getSurvey();
    if (!this.patientSurveyUpdated) {
      this.setState({
        warningMessage: "",
        embeddedDate: moment(this.date, "YYYY-MM-DD"),
        survey: patientSurvey ? patientSurvey.answers : this.state.defaultSurvey
      });
      this.patientSurveyUpdated = true
    }
    // update planner
    const patientPlanner = this.getPlanner();
    if (!this.patientPlannerUpdated) {
      this.setState({
        warningMessage: "",
        embeddedDate: moment(this.date, "YYYY-MM-DD"),
        plannerItems: patientPlanner ? patientPlanner.data : this.state.defaultPlannerItems,
        displayPlannerItems: patientPlanner ? patientPlanner.data : this.state.defaultPlannerItems
      });
      this.patientPlannerUpdated = true
    }
  }

  toggleDeleteModal() {
    this.setState({
      deleteModalOpen: !this.state.deleteModalOpen
    });
  }

  toggleCompleteModal() {
    this.setState({
      completeModalOpen: !this.state.completeModalOpen
    });
  }

  toggleInCompleteModal() {
    this.setState({
      inCompleteModalOpen: !this.state.inCompleteModalOpen
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
      const surveyPath = `${localStorage.getItem('user_id')}/patients/${this.patientId}/surveys/${surveyId}`;

      if (this.state.survey.S === 'na') {
        this.setState({
          warningMessage: `Please decide for "Overall Tract Assessment"!`,
        });
        return;
      } else {
        this.setState({
          warningMessage: ``,
        });
        return database.ref(surveyPath).set({
          answers: this.state.survey,
          na: this.getSum("na"),
          verylow: this.getSum("verylow"),
          low: this.getSum("low"),
          medium: this.getSum("medium"),
          high: this.getSum("high"),
          veryhigh: this.getSum("veryhigh")
        }).then(response => {
          this.props.getPatientsList();
        }).catch(error => error);
      }

      
    }
  }

  handleDeleteSurvey() {
    if (this.patientId) {
      const surveyId = this.getDate();
      const surveyPath = `${localStorage.getItem('user_id')}/patients/${this.patientId}/surveys/${surveyId}`;

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
        warningMessage: `You have unsaved changes!`
      }))
    } else {
      // do nothing because discharged patient
    }
  }

  toggleTab(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
      this.patientSurveyUpdated = false;
      this.patientPlannerUpdated = false;
    }
  }

  toggleSplit() {
    this.setState(prevState => ({
      dropdownSplitOpen: !prevState.dropdownSplitOpen
    }));
  }
  
  getPlanner1() {
    const patient = this.getPatient();
    if (patient) {
      // if there is a datepicker for planners
      const date = this.getDate();
      if (date) {
        return patient.planners && patient.planners[date] ? patient.planners[date] : null
      }

      // no datepicker for planner
      return patient.planner ? patient.planner : null
    }
    return null
  }

  handleSavePlanner1() {
    //console.log(this.patientId);
    if (this.patientId) {
      const plannerId = this.getDate();
      const plannerPath = `${localStorage.getItem('user_id')}/patients/${this.patientId}/planners/${plannerId}`;

      // check if planner is entirely empty
      let isPlannerEmpty = true;
      for (let i = 0; i < this.state.plannerItems.length; i++) {
        let plannerItem = this.state.plannerItems[i];
        if (plannerItem.issue || plannerItem.action) {
          isPlannerEmpty = false;
          break;
        }
      }
      if (isPlannerEmpty) {
        this.setState({
          warningMessage: `Cannot save an empty planner!`,
        });
        return;
      } else {
        // cut empty entries
        let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems));
        for (let i = 0; i < plannerItems.length; i++) {
          if (plannerItems[i].issue.length == 0 && plannerItems[i].action.length == 0) {
            plannerItems.splice(i, 1);
            i--;
          }
        }
        // null warning message
        this.setState({
          plannerItems,
          warningMessage: ``,
        });
        // save planner into database
        return database.ref(plannerPath).set({
          data: plannerItems
        }).then(response => {
          this.props.getPatientsList();
        }).catch(error => error);
      }
    }
  }

  handleDeletePlanner1() {
    if (this.patientId) {
      const plannerId = this.getDate();
      const plannerPath = `${localStorage.getItem('user_id')}/patients/${this.patientId}/planners/${plannerId}`;

      return database.ref(plannerPath).remove()
        .then(response => {
        this.props.getPatientsList();
        this.patientPlannerUpdated = false;
      }).catch(error => error);
    }
  }
  
  handlePlannerChange1(i, type, event) {
    // if active patient then allow changes
    if (this.status === 'Active') {
      let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
      if (type === 'issue') {
        plannerItems[i].issue = event.target.value;
      } else if (type === 'action') {
        plannerItems[i].action = event.target.value;
      } else if (type === 'complete') {
        plannerItems[i].complete = !plannerItems[i].complete;
      }
      this.setState({ 
        plannerItems,
        warningMessage: `You have unsaved changes!`
      }); 
    } else {
      // if discharged patient then simply do nothing
    }
    
  }

  addPlannerItemClick1() {
    // if active patient then allow changes
    if (this.status === 'Active') {
      this.setState(prevState => ({
        plannerItems: [...prevState.plannerItems, this.state.defaultPlannerItem],
        warningMessage: `You have unsaved changes!`
      }))
    } else {
      // if discharged patient then simply do nothing
    }
  }

  removePlannerItemClick1(i)  {
    // if active patient then allow changes
    if (this.status === 'Active') {
      let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
      plannerItems.splice(i, 1);
      this.setState({ 
        plannerItems,
        warningMessage: `You have unsaved changes!`
      }); 
    } else {
      // if discharged patient then simply do nothing¬
    }
  }

  handlePlannerSubmit1(event) {
    alert('A planner was submitted: ' + this.state.plannerItems.join(', '));
    event.preventDefault();
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

  handleSavePlanner() {
    if (this.patientId) {
      // const plannerId = this.getDate();
      const plannerPath = `${localStorage.getItem('user_id')}/patients/${this.patientId}/planner`;

      // check if planner is entirely empty
      let isPlannerEmpty = true;
      console.log(this.state.plannerItems);
      if (this.state.plannerItems) {
        for (let i = 0; i < this.state.plannerItems.length; i++) {
          let plannerItem = this.state.plannerItems[i];
          if (plannerItem.issue || plannerItem.action || plannerItem.note) {
            isPlannerEmpty = false;
            break;
          }
        }
      }
      if (isPlannerEmpty) {
        this.setState({
          warningMessage: `Cannot save an empty planner!`,
        });
        return;
      } else {
        // cut empty incomplete entries
        let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems));
        for (let i = 0; i < plannerItems.length; i++) {
          if (plannerItems[i].issue.length === 0 && plannerItems[i].action.length === 0 && plannerItems[i].note.length === 0) {
            plannerItems.splice(i, 1);
            i--;
          }
        }
        // null warning message
        this.setState({
          plannerItems,
          warningMessage: ``,
        });
        // save planner into database
        return database.ref(plannerPath).set({
          data: plannerItems
        }).then(response => {
          this.props.getPatientsList();
        }).catch(error => error);
      }
    }
  }
  
  handlePlannerChange(i, type, event) {
    // if active patient then allow changes
    if (this.status === 'Active') {
      // check if incomplete task and allow changes
        let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
        if (type === 'issue') {
          plannerItems[i].issue = event.target.value;
        } else if (type === 'action') {
          plannerItems[i].action = event.target.value;
        } else if (type === 'note') {
          plannerItems[i].note = event.target.value;
        }
        plannerItems[i].updatedDate = new Date().toLocaleDateString('en-UK');
        this.setState({ 
          plannerItems,
          //warningMessage: `You have unsaved changes!`
        }); 
      } else {
        // if discharged patient then simply do nothing
      }
  }

  handlePlannerItemComplete(i, type, event) {
    // check if there are unsaved changes
    if (this.state.warningMessage.length > 0) {
      this.setState({ 
        warningMessage: `You have unsaved changes! Please save first before marking task as complete!`
      });
    } else {
      let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
      plannerItems[i].complete = !plannerItems[i].complete;
      plannerItems[i].updatedDate = new Date().toLocaleDateString('en-UK');
      
      this.setState({ 
        plannerItems,
      }, this.handleSavePlanner); 
      if (type === 'complete') {
        this.toggleCompleteModal();
      } else if (type === 'incomplete') {
        this.toggleInCompleteModal();
      }

    }
  }

  addPlannerItemClick() {
    this.setState(prevState => ({
      plannerItems: [...prevState.plannerItems, this.state.defaultPlannerItem],
      // warningMessage: `You have unsaved changes!`
    }))
  }

  removePlannerItemClick(i)  {
    let plannerItems = JSON.parse(JSON.stringify(this.state.plannerItems))
    plannerItems.splice(i, 1);
    this.setState({ 
      plannerItems,
    }, this.handleSavePlanner); 
    this.toggleDeleteModal();
  }

  handlePlannerSubmit(event) {
    alert('A planner was submitted: ' + this.state.plannerItems.join(', '));
    event.preventDefault();
  }

  createPlannerUI() {

    let warningBox;
    let warningStyle = { 
      "textAlign": "center",
      "fontWeight": "bolder"
    };
    if (this.state.warningMessage.length > 0) {
      warningBox = 
      <div className="notification-error mt-2 mb-2" style={warningStyle}>
        {this.state.warningMessage}
      </div>
    } else {
      warningBox = null;
    }

    let plannerCardClass = [];
    for (let i = 0; i < this.state.plannerItems.length; i++) {
      if (this.state.plannerItems[i].complete) {
        plannerCardClass.push("d-flex flex-grow-1 min-width-zero flex-row card-planner-complete")
      } else {
        plannerCardClass.push("d-flex flex-grow-1 min-width-zero flex-row card-planner-noncomplete")
      }
    }
    let incompleteTaskList = [];
    for (let i = 0; i < this.state.plannerItems.length; i++) {
      if (this.state.plannerItems[i].complete === false) {
        incompleteTaskList.push([this.state.plannerItems[i], i])
      }
    }

    let incompletePlannerItemList;
    let incompleteTaskLabel = <h3>Incomplete tasks:</h3>
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

                                              <Label className="list-item-heading">
                                                Care trajectory managemenent issue:
                                              </Label>
                                              <Input
                                                className="h-10"
                                                type="text"
                                                value={plannerItem[0].issue}
                                                onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'issue')}
                                              />
                                              <Label className="list-item-heading mt-2">
                                                  Action:
                                              </Label>
                                              <Input
                                                type="text"
                                                value={plannerItem[0].action}
                                                onChange={this.handlePlannerChange.bind(this, plannerItem[1], 'action')}
                                              />
                                              <Label className="list-item-heading mt-2">
                                                  Notes:
                                              </Label>
                                              <Input
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
                                                  onClick={this.handleSavePlanner}
                                                >
                                                  <IntlMessages id="todo.save" />
                                                </Button>
                                                <Button
                                                  hidden={this.status !== "Active"}
                                                  outline
                                                  color="primary"
                                                  size="sm"
                                                  //onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1])}
                                                  onClick={this.toggleCompleteModal}
                                                >
                                                  <IntlMessages id="todo.complete" />
                                                </Button>
                                                <Modal isOpen={this.state.completeModalOpen} toggle={this.toggleCompleteModal} wrapClassName="modal-middle" backdrop="static">
                                                  <ModalHeader toggle={this.toggleCompleteModal}>
                                                    Are you sure?
                                                  </ModalHeader>
                                                  <ModalBody>
                                                    <p>Do you really want to mark this task as complete?</p>
                                                  </ModalBody>
                                                  <ModalFooter>
                                                    <Button color="primary" onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1], 'complete')}>
                                                      <IntlMessages id="todo.confirm" />
                                                    </Button>
                                                    <Button color="primary" outline onClick={this.toggleCompleteModal}>
                                                      <IntlMessages id="todo.cancel" />
                                                    </Button>
                                                  </ModalFooter>
                                                </Modal>
                                              </div>
                                              {warningBox}
                                            </div>
                                            <div className="card-top-buttons">
                                              <Button 
                                                hidden={this.status !== "Active"}
                                                close
                                                //onClick={this.removePlannerItemClick.bind(this, plannerItem[1])}
                                                onClick={this.toggleDeleteModal}
                                                >
                                                <span aria-hidden="true">&times;</span>
                                              </Button>
                                              <Modal isOpen={this.state.deleteModalOpen} toggle={this.toggleDeleteModal} wrapClassName="modal-middle" backdrop="static">
                                                <ModalHeader toggle={this.toggleDeleteModal}>
                                                  Are you sure?
                                                </ModalHeader>
                                                <ModalBody>
                                                  <p>Do you really want to delete this task?</p>
                                                  <p>This action cannot be undone!</p>
                                                </ModalBody>
                                                <ModalFooter>
                                                  <Button color="primary" onClick={this.removePlannerItemClick.bind(this, plannerItem[1])}>
                                                    <IntlMessages id="todo.confirm" />
                                                  </Button>
                                                  <Button color="primary" outline onClick={this.toggleDeleteModal}>
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

    let completeTaskList = [];
      for (let i = 0; i < this.state.plannerItems.length; i++) {
        if (this.state.plannerItems[i].complete === true) {
          completeTaskList.push([this.state.plannerItems[i], i])
        }
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

                                            <Label className="list-item-heading">
                                              Care trajectory managemenent issue:
                                            </Label>
                                            <Input
                                              className="h-10"
                                              type="text"
                                              value={plannerItem[0].issue}
                                            />
                                            <Label className="list-item-heading mt-2">
                                                Action:
                                            </Label>
                                            <Input
                                              type="text"
                                              value={plannerItem[0].action}
                                            />
                                            <Label className="list-item-heading mt-2">
                                                Notes:
                                            </Label>
                                            <Input
                                              type="textarea"
                                              value={plannerItem[0].note}
                                            />
                                            <div className="d-flex flex-grow-1 min-width-zero flex-row mt-2">
                                                <Button
                                                  hidden={this.status !== "Active"}
                                                  outline
                                                  color="primary"
                                                  size="sm"
                                                  className="mt-2 mr-2"
                                                  //onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1])}
                                                  onClick={this.toggleInCompleteModal}
                                                >
                                                  <IntlMessages id="todo.incomplete" />
                                                </Button>
                                                <Modal isOpen={this.state.inCompleteModalOpen} toggle={this.toggleInCompleteModal} wrapClassName="modal-middle" backdrop="static">
                                                  <ModalHeader toggle={this.toggleInCompleteModal}>
                                                    Are you sure?
                                                  </ModalHeader>
                                                  <ModalBody>
                                                    <p>Do you really want to mark this task as incomplete?</p>
                                                  </ModalBody>
                                                  <ModalFooter>
                                                    <Button color="primary" onClick={this.handlePlannerItemComplete.bind(this, plannerItem[1], 'incomplete')}>
                                                      <IntlMessages id="todo.confirm" />
                                                    </Button>
                                                    <Button color="primary" outline onClick={this.toggleInCompleteModal}>
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

    // old planner implementation
    // return this.state.plannerItems.map((plannerItem, i) => (
    //     <div key={i}>
    //       <Card className="question d-flex mb-3">
    //         <div className={plannerCardClass[i]}>
    //           <div className="card-body card-planner align-self-center d-flex flex-column justify-content-between min-width-zero">
    //             <div className="d-flex flex-row">
    //                 <Label className="list-item-heading">
    //                   Date raised:&nbsp;&nbsp;
    //                 </Label>
    //                 <Label className="list-item-heading">
    //                   {plannerItem.createdDate}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    //                 </Label>
    //                 <Label className="list-item-heading">
    //                   Last updated:&nbsp;&nbsp;
    //                 </Label>
    //                 <Label className="list-item-heading">
    //                   {plannerItem.updatedDate}
    //                 </Label>
    //             </div>

    //             <Label className="list-item-heading">
    //               Care trajectory managemenent issue:
    //             </Label>
    //             <Input
    //               className="h-10"
    //               type="text"
    //               value={plannerItem.issue}
    //               onChange={this.handlePlannerChange.bind(this, i, 'issue')}
    //             />
    //             <Label className="list-item-heading mt-2">
    //                 Action:
    //             </Label>
    //             <Input
    //               type="text"
    //               value={plannerItem.action}
    //               onChange={this.handlePlannerChange.bind(this, i, 'action')}
    //             />
    //             <Label className="list-item-heading mt-2">
    //                 Notes:
    //             </Label>
    //             <Input
    //               type="textarea"
    //               value={plannerItem.note}
    //               onChange={this.handlePlannerChange.bind(this, i, 'note')}
    //             />
    //             <div className="d-flex flex-grow-1 min-width-zero flex-row mt-2">
    //               <Label className="list-item-heading mt-2">
    //                   Action complete?
    //               </Label>
    //               <div className="custom-control custom-checkbox align-self-center justify-content-between">
    //                 <CustomInput
    //                   color="secondary"
    //                   type="checkbox"
    //                   id={`check_${i}`}
    //                   checked={plannerItem.complete}
    //                   onChange={this.handlePlannerChange.bind(this, i, 'complete')}
    //                 />
    //               </div>
    //             </div>
    //           </div>
    //           <div className="card-top-buttons">
    //             <Button 
    //               close
    //               onClick={this.removePlannerItemClick.bind(this, i)}
    //               >
    //               <span aria-hidden="true">&times;</span>
    //             </Button>
    //           </div>
    //         </div>
    //       </Card>
    //     </div>     
    // ))
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
    if (this.state.warningMessage.length > 0) {
      warningBox = 
      <div className="notification-error mb-2" style={warningStyle}>
        {this.state.warningMessage}
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

    let totalTasksCount = this.state.plannerItems.length;
    let incompleteTasksCount = 0;
    for (let i = 0; i < this.state.plannerItems.length; i++) {
      if (this.state.plannerItems[i].complete === false) {
        incompleteTasksCount++;
      }
    }

    let highlightAssessmentDates = [];
    if (patient && patient.surveys) {
      for (let k in patient.surveys) {
        highlightAssessmentDates.push(moment(k, "YYYY-MM-DD"))
      }
    }

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
      />
    ));

    // datepicker for planner (deprecated)
    // let highlightPlannerDates = [];
    // if (patient && patient.planners) {
    //   for (let k in patient.planners) {
    //     highlightPlannerDates.push(moment(k, "YYYY-MM-DD"))
    //   }
    // }

    // const PlannerDatePicker = withRouter(({history}) => (
    //   <DatePicker
    //     calendarClassName="embedded"
    //     inline
    //     selected={this.state.embeddedDate}
    //     onChange={(date) => {
    //       this.patientPlannerUpdated = false
    //       history.push(`/app/patients/detail/${this.patientId}/${date.format("YYYY-MM-DD")}/${this.status}`)
    //     }}
    //     highlightDates={highlightPlannerDates}
    //   />
    // ));

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

    // let savePlannerButton;
    // if (this.status === 'Active') {
    //   savePlannerButton = <ButtonDropdown
    //                   className="top-right-button top-right-button-single"
    //                   isOpen={this.state.dropdownSplitOpen}
    //                   toggle={this.toggleSplit}
    //                 >
    //                   <Button
    //                     outline
    //                     className="flex-grow-1"
    //                     size="lg"
    //                     color="primary"
    //                     onClick={this.handleSavePlanner}
    //                   >
    //                     SAVE
    //                   </Button>
    //                   <DropdownToggle
    //                     size="lg"
    //                     className="pr-4 pl-4"
    //                     caret
    //                     outline
    //                     color="primary"
    //                   />
    //                   <DropdownMenu persist>
    //                     <DropdownItem
    //                       onClick={() => { 
    //                         this.handleDeletePlanner(); 
    //                       }}
    //                     >
    //                       DELETE
    //                     </DropdownItem>
    //                   </DropdownMenu>
    //                 </ButtonDropdown>
    // } else {
    //   savePlannerButton = null;
    // }

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
            <h1>
              <span className="align-middle d-inline-block pt-1"><IntlMessages id="menu.patients" /></span>
            </h1>
            

            {/* <BreadcrumbItems match={this.props.match} /> */}
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
                  ASSESSMENT
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
                  PLANNER
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

                        <p className="text-muted text-small mb-2">Created Date</p>
                        <p className="mb-3">{patient ? patient.createDate: null}</p>

                      </CardBody>
                    </Card>

                    {/* Datepicker for assessment */}
                    <Card>
                      <CardBody>
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

                        <p className="text-muted text-small mb-2">Created Date</p>
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
                  </Colxx>

                  <Colxx xxs="12" lg="8">
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
                    Completed Surveys
                    <span className="float-right">{patient && patient.surveys ? Object.keys(patient.surveys).length : 0 }</span>{" "}
                  </NavLink>
                  {/* <NavLink to="#">
                    <i className="simple-icon-check" />
                    Completed Planners
                    <span className="float-right">{patient && patient.planners ? Object.keys(patient.planners).length : 0 }</span>{" "}
                  </NavLink> */}
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
