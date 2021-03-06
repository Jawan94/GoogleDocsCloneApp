import React from 'react';
import { Editor, EditorState, RichUtils, DefaultDraftBlockRenderMap, convertFromRaw, convertToRaw } from 'draft-js';
import * as colors from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import FontIcon from 'material-ui/FontIcon';
import RaisedButton from 'material-ui/RaisedButton';
import { CirclePicker } from 'react-color';
import Popover from 'material-ui/Popover';
import { Map } from 'immutable';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';

import FlatButton from 'material-ui/FlatButton';
import axios from 'axios';


const myBlockTypes = DefaultDraftBlockRenderMap.merge(new Map({
  center: {
    wrapper: <div className="center-align" />
  },
  right: {
    wrapper: <div className="right-align" />
  }
}));

class EditText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      currentFontSize: 12,
      inlineStyles: {},
      title: ''
    };
    // this.socket = io('http://localhost:3000');
  }





  onChange(editorState) {
    this.setState({
      editorState
    });
  }

  toggleFormat(e, style, block) {
    e.preventDefault();
    if(block) {
      this.setState({
        editorState: RichUtils.toggleBlockType(this.state.editorState, style)
      });
    } else {
      this.setState({
        editorState: RichUtils.toggleInlineStyle(this.state.editorState, style)
      });
    }
  }

  formatButton({icon, style, block}) {
    return(
      <RaisedButton
      backgroundColor={
        this.state.editorState.getCurrentInlineStyle().has(style) ?
        colors.pink100 :
        colors.pinkA200
      }
      onMouseDown={(e) => this.toggleFormat(e,  style, block)}
      icon={<FontIcon className="material-icons">{icon}</FontIcon>}
      />
    );
  }

  formatColor(color) {
    // this.refs.editor.focus();
    console.log('COLOR IS', color);
    var newInlineStyle = Object.assign(
      {},
      this.state.inlineStyles,
      {
        [color.hex]: {
          color: color.hex,
        }
      }
    );
    this.setState({
      inlineStyles: newInlineStyle,
      editorState: RichUtils.toggleInlineStyle(this.state.editorState, color.hex)
    });
  }

  openColorPicker(e) {

    this.setState({
      colorPickerOpen: true,
      colorPickerButton: e.target
    });
  }

  closeColorPicker(e) {
    this.setState({
      colorPickerOpen: false
    });
  }

  colorPicker() {
    return(
      <div style={{display: 'inline-block'}}>
      <RaisedButton
      backgroundColor={colors.pinkA200}
      icon={<FontIcon className="material-icons">format_paint</FontIcon>}
      onClick={this.openColorPicker.bind(this)}
      />
      <Popover
      open={this.state.colorPickerOpen}
      anchorEl={this.state.colorPickerButton}
      anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
      targetOrigin={{horizontal: 'left', vertical: 'top'}}
      onRequestClose={this.closeColorPicker.bind(this)}
      >
      <CirclePicker onChangeComplete={this.formatColor.bind(this)} />
      </Popover>
      </div>
    );
  }

  applyIncreaseFrontSize(shrink) {
    var newFontSize = this.state.currentFontSize + (shrink ? -4 : 4);
    var newInlineStyle = Object.assign(
      {},
      this.state.inlineStyles,
      {
        [newFontSize]: {
          fontSize: `${newFontSize}px`
        }
      }
    );
    this.setState({
      inlineStyles: newInlineStyle,
      editorState: RichUtils.toggleInlineStyle(this.state.editorState, String(newFontSize)),
      currentFontSize: newFontSize
    });
  }

  increaseFontSize(shrink) {
    return(
      <RaisedButton
      backgroundColor={colors.pinkA200}
      onClick={() => this.applyIncreaseFrontSize(shrink)}
      icon={<FontIcon className="material-icons">{shrink ? "zoom_out": "zoom_in"}</FontIcon>}
      />
    );
  }


  componentDidMount() {
    // load document content and title (owner ? register with names?)

    const docId = this.props.match.params.dochash;

    fetch(`http://localhost:3000/getdocument/${docId}`, {
      credentials: 'include'
    })
    .then(resp => resp.json())
    .then(resp => {
      if (resp.success) {
        const raw = resp.document.content;

        if (raw) {
          const contentState = convertFromRaw(JSON.parse(raw));
          this.setState({
            editorState: EditorState.createWithContent(contentState),
            title: resp.document.title
          });
        } else {
          this.setState({
            title: resp.document.title
          });
        }

      } else {
        this.setState({ error: resp.error.errmsg});
      }
    })
    .catch(err => { throw err });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }


  componentDidMount() {
    var path = this.props.location.pathname.split(':');


    axios.get('http://localhost:3000/editPage/' + path[1], {})
    .then((resp) => {
      if(resp.data.success){
        this.setState({
          title: resp.data.doc.title,
        });
      }
    })
    .catch((err) => console.log('BAD', err));
  }


  saveDoc() {
    const contentState = this.state.editorState.getCurrentContent();
    const stringifiedContent = JSON.stringify(convertToRaw(contentState));
    const docId = this.props.match.params.dochash;

    console.log('MADE IT');

    console.log('this is the docId', docId);
    fetch(`http://localhost:3000/savedocument/${docId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: stringifiedContent })
    })
    .then(resp => resp.json())
    .then(resp => {
      if (resp.success) {
        // successful save
      } else {
        throw resp.error;
      }
    })
    .catch(err => { throw err });
  }




  render() {
    return (
      <div>
        <AppBar
          iconElementLeft={<IconButton><NavigationClose /></IconButton>}
          onLeftIconButtonTouchTap={() => this.props.history.push('/docPage')}
          iconElementRight={<FlatButton label="Save" />}
          title={"Document Name: " + this.state.title}
         />
        <div className="toolbar">
          {this.formatButton({icon: 'format_bold', style: 'BOLD'})}
          {this.formatButton({icon: 'format_italic', style: 'ITALIC'})}
          {this.formatButton({icon: 'format_underlined', style: 'UNDERLINE'})}
          {this.colorPicker()}
          {this.formatButton({icon: 'format_list_numbered ', style: 'ordered-list-item', block: true})}
          {this.formatButton({icon: 'format_align_left ', style: 'unstyled', block: true})}
          {this.formatButton({icon: 'format_align_center ', style: 'center', block: true})}
          {this.formatButton({icon: 'format_align_right ', style: 'right', block: true})}
          {this.increaseFontSize(false)}
          {this.increaseFontSize(true)}
          {/* {this.saveBotton({icon: 'format_save'})} */}

        </div>
        <div className="container">
          <div className="editbox">
            <Editor
              ref="editor"
              blockRenderMap={myBlockTypes}
              customStyleMap={this.state.inlineStyles}
              onChange={this.onChange.bind(this)}
              editorState={this.state.editorState}
            />
          </div>
        </div>
    </div>
    );
  }
}

export default EditText;
