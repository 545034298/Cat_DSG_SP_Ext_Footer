import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';

import * as strings from 'CatDsgSpExt1002FooterApplicationCustomizerStrings';
import pnp, { Web } from "sp-pnp-js";
import CatDsgSpExt1002ScriptLoader from './CatDsgSpExt1002ScriptLoader';
const LOG_SOURCE: string = 'CatDsgSpExt1002FooterApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface ICatDsgSpExt1002FooterApplicationCustomizerProperties {
  // This is an example; replace with your own property
  footerGroupsListName: string;
  footerLinksListName: string;
}

export interface IFooterGroup {
  Title: string;
  SortOrder: number;
}

export interface IFooterLinks {
  Title: string;
  Link: string;
  FooterSection: string;
  External: boolean;
  SortOrder: number;
  Group: IFooterGroup;
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

      if (!this._footerContent) {
        console.error('The expected placeholder (Bottom) was not found.');
        return;
      }
      if (this._footerContent.domElement) {
        require('./CatDsgSpExt1002FooterApplicationCustomizer.scss');
        this._footerContent.domElement.innerHTML = `
                                                  <div id="catDsgSpExt1002_footer" class="ms-dialogHidden">	
                                                    <div class="catDsgSpExt1002_inner-footer">
                                                    <div id='catDsgSpExt1002_mastfoot' class='ms-dialogHidden' style='visibility:hidden'></div>
                                                    </div>
                                                  </div>`;
        let script: CatDsgSpExt1002ScriptLoader.IScript = {
          Url: "https://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.11.1.min.js",
          GlobalExportsName: "jQuery",
          WindowPropertiesChain: "jQuery"
        };
        CatDsgSpExt1002ScriptLoader.LoadScript(script, []).then(() => {
          this.getFooterLinks().then(links => {
            if (links && links.length > 0) {
              this.buildFooterHtml(links);
            }
            else {
              console.warn(strings.CatDsgSpExt1002FooterFooterLinksListHaveNoData);
            }
          }, error => {
            console.error(error);
          });

        }, error => {
          console.log(error);
        });


      }
    }
  }

  private buildFooterHtml(links: IFooterLinks[]) {
    let sortedFooterLinks = this.SortFooterLinks(links);
    var footerTopHTML = "<div id='catDsgSpExt1002_mastfoot-top' class='catDsgSpExt1002_mastfoot-inner'><div class='catDsgSpExt1002_mastfoot-content'>";
    var footerMiddleHTML = "<div id='catDsgSpExt1002_mastfoot-middle' class='catDsgSpExt1002_mastfoot-inner'><div class='catDsgSpExt1002_mastfoot-content'>";
    var footerBottomHTML = "<div id='catDsgSpExt1002_mastfoot-bottom' class='catDsgSpExt1002_mastfoot-inner'><div class='catDsgSpExt1002_mastfoot-content'>";
    var footerTopDetailHTML;
    var footerMiddleDetailHTML;
    var footerBottomDetailHTML;
    // Used for determining when a new group name has been found in the returned item and if so starts a new unordered list. 
    var prevGroup = '';
    // Used for determining how wide the footer's inner content area should be based on the total number of groups found
    var groupNum = 0;
    // Link Target (ex. for external open in new tab)
    var linkType = '';
    for (let j = 0; j < sortedFooterLinks.length; j++) {
      let itemHtml = '';
      if (sortedFooterLinks[j].External) {
        linkType = '_blank';
      }
      else {
        linkType = '_self';
      }
      // Build top section (column group links)
      if (sortedFooterLinks[j].FooterSection == "Top") {
        // Get current group name
        var currGroup: string = sortedFooterLinks[j].Group.Title;
        // Check if the current item is the first item in the current group
        if (j == 0) {
          // Build the group heading and the first link item under the group list but don't display the group name for uncategorized or when null
          if (currGroup === null || currGroup.toLowerCase() == 'uncategorized') {
            // Build the item HTML string based on whether a link was provided or not.
            itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a>";
            // Finish building the rest of the HTML string including the item itself.
            footerTopDetailHTML = "<ul class='catDsgSpExt1002_mastfoot-group'><li class='catDsgSpExt1002_mastfoot-heading hide' data-sort='" + sortedFooterLinks[j].Group.SortOrder + "'>" + currGroup + "</li><li class='catDsgSpExt1002_mastfoot-item'>" + itemHtml + "</li>";
          }
          else {
            // Build the item HTML string based on whether a link was provided or not.
            itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a>";
            // Finish building the rest of the HTML string including the item itself.
            footerTopDetailHTML = "<ul class='catDsgSpExt1002_mastfoot-group'><li class='catDsgSpExt1002_mastfoot-heading' data-sort='" + sortedFooterLinks[j].Group.SortOrder + "'>" + currGroup + "</li><li class='catDsgSpExt1002_mastfoot-item'>" + itemHtml + "</li>";
          }
          groupNum++;
          prevGroup = currGroup;
        }
        else {
          // Check if current item belongs to the previous group, if so continue building that group's list of links.
          if (currGroup == prevGroup) {
            // Build the item HTML string based on whether a link was provided or not.
            itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a>";
            // Finish building the rest of the HTML string including the item itself but don't build the group header item
            footerTopDetailHTML = "<li class='catDsgSpExt1002_mastfoot-item'>" + itemHtml + "</li>";
            prevGroup = currGroup;
          }
          else {
            // Build the group heading and the first link item under the group list but don't display the group name for uncategorized or when null
            if (currGroup === null || currGroup.toLowerCase() == 'uncategorized') {
              // Build the item HTML string based on whether a link was provided or not.
              itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a>";
              // Finish building the rest of the HTML string including the item itself.
              footerTopDetailHTML = "</ul><ul class='catDsgSpExt1002_mastfoot-group'><li class='catDsgSpExt1002_mastfoot-heading hide' data-sort='" + sortedFooterLinks[j].Group.SortOrder + "'>" + currGroup + "</li><li class='catDsgSpExt1002_mastfoot-item'>" + itemHtml + "</li>";
            }
            else {
              // Build the item HTML string based on whether a link was provided or not.
              itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a>";
              // Finish building the rest of the HTML string including the item itself.
              footerTopDetailHTML = "</ul><ul class='catDsgSpExt1002_mastfoot-group'><li class='catDsgSpExt1002_mastfoot-heading' data-sort='" + sortedFooterLinks[j].Group.SortOrder + "'>" + currGroup + "</li><li class='catDsgSpExt1002_mastfoot-item'>" + itemHtml + "</li>";
            }
            groupNum++;
            prevGroup = currGroup;
          }
        }
        // Collect each item's full HTML strings
        footerTopHTML = footerTopHTML + footerTopDetailHTML;
      }
      // Build middle section (Horizontal links)
      if (sortedFooterLinks[j].FooterSection == "Middle") {
        // Build the item HTML string based on whether a link was provided or not.
        itemHtml = (sortedFooterLinks[j].Link == null) ? sortedFooterLinks[j].Title : "<a class='catDsgSpExt1002_mastfoot-item' href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "'>" + sortedFooterLinks[j].Title + "</a> ";
        // Finish building the rest of the HTML string including the item itself.
        footerMiddleDetailHTML = itemHtml + " ";
        // Collect each item's full HTML strings
        footerMiddleHTML = footerMiddleHTML + footerMiddleDetailHTML;
      }
      // Build bottom section (Social links)
      if (sortedFooterLinks[j].FooterSection == "Bottom") {
        // Convert the social title to lowercase and strip out spaces so it can work as a css class name
        var socialTitle = sortedFooterLinks[j].Title.toLowerCase().replace(/ /g, "");
        // Build the item HTML string based on whether a link was provided or not.
        itemHtml = (sortedFooterLinks[j].Link == null) ? "<a class='catDsgSpExt1002_mastfoot-item " + socialTitle + "' href='#' style='cursor:default;' title='" + socialTitle + "'></a> " : "<a class='catDsgSpExt1002_mastfoot-item " + socialTitle + "' href='" + sortedFooterLinks[j].Link + "' target='" + linkType + "' title='" + socialTitle + "'></a> ";
        // Finish building the rest of the HTML string including the item itself.
        footerBottomDetailHTML = itemHtml;
        // Collect each item's full HTML strings
        footerBottomHTML = footerBottomHTML + footerBottomDetailHTML;
      }
    }
    // Build the closing html tags
    footerTopHTML = footerTopHTML + "</ul></div><hr></div>";
    footerMiddleHTML = footerMiddleHTML + "</div></div>";
    footerBottomHTML = footerBottomHTML + "</div></div>";
    // Get the footer placholder from the DOM
    var data = $(this._footerContent.domElement).find('#catDsgSpExt1002_mastfoot');
    // Make sure it is empty before attaching the new html
    data.html('');
    // Attach the new html to the DOM
    data.html(footerTopHTML + footerMiddleHTML + footerBottomHTML);
    // Adjust the footer's inner width based on the number of groups found
    var el = '#catDsgSpExt1002_mastfoot .catDsgSpExt1002_mastfoot-inner';
    if ((groupNum > 3) && (groupNum < 6)) {
      $(this._footerContent.domElement).find(el).addClass('catDsgSpExt1002_mastfoot-inner-width-75');
    }
    if (groupNum > 5) {
      $(this._footerContent.domElement).find(el).removeClass('catDsgSpExt1002_mastfoot-inner-width-75').addClass('catDsgSpExt1002_mastfoot-inner-width-95');
    }

    if (!$.trim($(this._footerContent.domElement).find('#catDsgSpExt1002_mastfoot-top .catDsgSpExt1002_mastfoot-content').html()).length) {
      $(this._footerContent.domElement).find('#catDsgSpExt1002_mastfoot-top hr').remove();
    }
    // Display the completed footer
    $(this._footerContent.domElement).find('#catDsgSpExt1002_mastfoot').removeAttr('style');
  }

  private getFooterLinks(): Promise<IFooterLinks[]> {
    return new Promise<IFooterLinks[]>((resolve, reject) => {
      let list = new Web(this.context.pageContext.site.absoluteUrl).lists.getByTitle(this.properties.footerLinksListName);
      list.items.select("Title", "SortOrder", "Link", "FooterSection", "External", "Group/Title", "Group/SortOrder").expand("Group").get().then((footerlinks: IFooterLinks[]) => {
        resolve(footerlinks);
      }, (error) => {
        console.log(LOG_SOURCE + ":" + strings.CatDsgSpExt1002FooterFailedRetrieveFooterLinks + "\r\n" + error);
        this._footerContent.domElement.innerHTML = error;
        reject(strings.CatDsgSpExt1002FooterFailedRetrieveFooterLinks);
      });
    });
  }

  private SortFooterLinks(links: IFooterLinks[]): IFooterLinks[] {
    let sortedLinks = links.sort((a, b) => {
      if (a.Group.SortOrder && b.Group.SortOrder) {
        let groupSortOrderComparasionResult = (a.Group.SortOrder - b.Group.SortOrder);
        if (groupSortOrderComparasionResult == 0) {
          if (a.Group.Title && b.Group.Title) {
            let groupTitleComparasionResult = (a.Group.Title.toString().localeCompare(b.Group.Title.toString()));
            if (groupTitleComparasionResult == 0) {
              if (a.SortOrder && b.SortOrder) {
                let linkSortOrderComparasionResult = a.SortOrder - b.SortOrder;
                if (linkSortOrderComparasionResult == 0) {
                  if (a.Title && b.Title) {
                    return a.Title.localeCompare(b.Title);
                  }
                  else {
                    if (!a.Title) {
                      return 1;
                    } else {
                      return -1;
                    }
                  }
                }
                else {
                  return linkSortOrderComparasionResult;
                }
              }
              else {
                if (!a.SortOrder) {
                  return 1;
                }
                else {
                  return -1;
                }
              }
            }
            else {
              return groupTitleComparasionResult;
            }
          }
          else {
            if (!a.Group.Title) {
              return 1;
            }
            else {
              return -1;
            }
          }
        }
        else {
          return groupSortOrderComparasionResult;
        }
      }
      else {
        if (!a.Group.SortOrder) {
          return 1;
        }
        else {
          return -1;
        }
      }
    });
    return sortedLinks;
  }
  private _onDispose(): void {
    console.log(LOG_SOURCE + ": Disposed custom bottom placeholder");
  }
}
