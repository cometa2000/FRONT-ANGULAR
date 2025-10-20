import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-vista-documento',
  templateUrl: './view-vista-documento.component.html',
  styleUrls: ['./view-vista-documento.component.scss']
})
export class ViewVistaDocumentoComponent {
  @Input() DOCUMENTO_SELECTED: any;

  constructor(public activeModal: NgbActiveModal) {}
}
