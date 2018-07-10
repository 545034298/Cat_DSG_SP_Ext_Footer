import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';

import * as strings from 'CatDsgSpExt1002FooterApplicationCustomizerStrings';

const LOG_SOURCE: string = 'CatDsgSpExt1002FooterApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface ICatDsgSpExt1002FooterApplicationCustomizerProperties {
  // This is an example; replace with your own property
  testMessage: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class CatDsgSpExt1002FooterApplicationCustomizer
  extends BaseApplicationCustomizer<ICatDsgSpExt1002FooterApplicationCustomizerProperties> {
  private _footerContent: PlaceholderContent | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    this.context.placeholderProvider.changedEvent.add(this, this.renderFooterContent);
    this.renderFooterContent();
    return Promise.resolve();
  }

  public renderFooterContent(): void {
    if (!this._footerContent) {
      this._footerContent =
        this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Bottom,
          { onDispose: this._onDispose });

      // The extension should not assume that the expected placeholder is available.
      if (!this._footerContent) {
        console.error('The expected placeholder (Top) was not found.');
        return;
      }
      if (this._footerContent.domElement) {


      }
    }
  }
  private _onDispose(): void {
    console.log(LOG_SOURCE + ": Disposed custom bottom placeholder");
  }
}
